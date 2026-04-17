/**
 * SMS MCP Server — write-gated.
 *
 * Sends SMS via Twilio only after a `confirmation_id` is confirmed.
 * Checks consent and quiet hours before sending — same guards as api/sms/send.js.
 * Credentials never leave this process.
 *
 * Run: npx tsx mcp/sms/server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getVaultCredential } from '../../vaults/schema.ts';

const server = new McpServer({ name: 'sms', version: '1.0.0' });

async function isConfirmed(confirmationId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM activity_log
    WHERE confirmation_id = ${confirmationId} AND status = 'confirmed'
    LIMIT 1
  `;
  return result.rows.length > 0;
}

async function hasSmsConsent(memberId: string, clubId: string): Promise<boolean> {
  const result = await sql`
    SELECT sms_consent FROM member_comm_preferences
    WHERE member_id = ${memberId} AND club_id = ${clubId}
    LIMIT 1
  `;
  return (result.rows[0]?.sms_consent as boolean | undefined) === true;
}

function isQuietHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour < 7 || hour >= 21;
}

// ---------------------------------------------------------------------------
// Tool: send_sms
// ---------------------------------------------------------------------------

server.tool(
  'send_sms',
  'Send an SMS to a member via Twilio. Requires confirmed confirmation_id, member consent, and non-quiet hours.',
  {
    confirmation_id: z.string().describe('Must be confirmed via /api/agents/confirm-action first'),
    club_id: z.string(),
    member_id: z.string(),
    to_phone: z.string().describe('E.164 format, e.g. +14155551234'),
    message: z.string().max(1600),
  },
  async ({ confirmation_id, club_id, member_id, to_phone, message }) => {
    if (!(await isConfirmed(confirmation_id))) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'not_confirmed', confirmation_id }) }] };
    }

    if (!(await hasSmsConsent(member_id, club_id))) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'no_consent', member_id }) }] };
    }

    if (isQuietHours()) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'quiet_hours', retry_after: '07:00' }) }] };
    }

    const accountSid = getVaultCredential('twilio_account_sid');
    const authToken = getVaultCredential('twilio_auth_token');
    const fromNumber = getVaultCredential('twilio_from_number');

    const params = new URLSearchParams({ To: to_phone, From: fromNumber, Body: message });

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    if (!resp.ok) {
      const detail = await resp.text();
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'send_failed', status: resp.status, detail }) }] };
    }

    const data = await resp.json() as { sid: string };

    await sql`
      UPDATE activity_log SET status = 'executed', executed_at = NOW()
      WHERE confirmation_id = ${confirmation_id}
    `;

    await sql`
      INSERT INTO sms_log (club_id, member_id, to_phone, message, twilio_sid, sent_at)
      VALUES (${club_id}, ${member_id}, ${to_phone}, ${message}, ${data.sid}, NOW())
    `;

    return { content: [{ type: 'text', text: JSON.stringify({ sent: true, sid: data.sid, to: to_phone }) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
