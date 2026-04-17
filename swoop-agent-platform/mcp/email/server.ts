/**
 * Email MCP Server — write-gated.
 *
 * Sends email only after a `confirmation_id` has been confirmed in activity_log.
 * Any call without a confirmed confirmation_id returns { error: 'not_confirmed' }.
 * Credentials never leave this process.
 *
 * Run: npx tsx mcp/email/server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getVaultCredential } from '../../vaults/schema.ts';

const server = new McpServer({ name: 'email', version: '1.0.0' });

async function isConfirmed(confirmationId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM activity_log
    WHERE confirmation_id = ${confirmationId} AND status = 'confirmed'
    LIMIT 1
  `;
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------------
// Tool: send_email
// ---------------------------------------------------------------------------

server.tool(
  'send_email',
  'Send an email to a member. Requires a confirmed confirmation_id before sending.',
  {
    confirmation_id: z.string().describe('Must be confirmed via /api/agents/confirm-action first'),
    to_email: z.string().email(),
    to_name: z.string(),
    subject: z.string(),
    body_text: z.string().describe('Plain text version'),
    body_html: z.string().optional().describe('HTML version (optional)'),
    from_name: z.string().optional().default('The Club'),
  },
  async ({ confirmation_id, to_email, to_name, subject, body_text, body_html, from_name }) => {
    if (!(await isConfirmed(confirmation_id))) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'not_confirmed', confirmation_id }) }] };
    }

    const apiKey = getVaultCredential('sendgrid_api_key');

    const payload = {
      personalizations: [{ to: [{ email: to_email, name: to_name }] }],
      from: { email: 'noreply@swoopgolf.com', name: from_name },
      subject,
      content: [
        { type: 'text/plain', value: body_text },
        ...(body_html ? [{ type: 'text/html', value: body_html }] : []),
      ],
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'send_failed', status: resp.status, detail }) }] };
    }

    await sql`
      UPDATE activity_log SET status = 'executed', executed_at = NOW()
      WHERE confirmation_id = ${confirmation_id}
    `;

    return { content: [{ type: 'text', text: JSON.stringify({ sent: true, to: to_email, subject }) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
