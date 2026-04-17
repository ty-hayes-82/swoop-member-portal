/**
 * ForeTees MCP Server — read-only.
 *
 * Exposes tee sheet, booking, and member booking history from ForeTees.
 * No write tools. All bookings go through request_human_confirmation.
 *
 * Run: npx tsx mcp/foretees/server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getVaultCredential } from '../../vaults/schema.ts';

getVaultCredential('foretees_api_key');

const server = new McpServer({ name: 'foretees', version: '1.0.0' });

// ---------------------------------------------------------------------------
// Tool: query_tee_sheet
// ---------------------------------------------------------------------------

server.tool(
  'query_tee_sheet',
  'Read the tee sheet for a club on a given date. Returns all booked tee times with member names and party size.',
  {
    club_id: z.string(),
    date: z.string().describe('ISO date YYYY-MM-DD'),
  },
  async ({ club_id, date }) => {
    const result = await sql`
      SELECT tee_time_id, tee_time, member_id, member_name,
             party_size, player_names, cart_required, confirmed,
             notes
      FROM tee_times
      WHERE club_id = ${club_id} AND tee_date = ${date}
      ORDER BY tee_time
    `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: read_booking
// ---------------------------------------------------------------------------

server.tool(
  'read_booking',
  'Read a specific tee time booking by ID.',
  {
    club_id: z.string(),
    tee_time_id: z.string(),
  },
  async ({ club_id, tee_time_id }) => {
    const result = await sql`
      SELECT tee_time_id, tee_date, tee_time, member_id, member_name,
             party_size, player_names, cart_required, confirmed,
             notes, created_at
      FROM tee_times
      WHERE club_id = ${club_id} AND tee_time_id = ${tee_time_id}
      LIMIT 1
    `;
    if (!result.rows[0]) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Not found' }) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result.rows[0]) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: query_member_bookings
// ---------------------------------------------------------------------------

server.tool(
  'query_member_bookings',
  'Query booking history for a specific member. Returns past and upcoming tee times.',
  {
    club_id: z.string(),
    member_id: z.string(),
    date_from: z.string().describe('ISO date'),
    date_to: z.string().describe('ISO date'),
    limit: z.number().int().min(1).max(200).optional().default(50),
  },
  async ({ club_id, member_id, date_from, date_to, limit }) => {
    const result = await sql`
      SELECT tee_time_id, tee_date, tee_time, party_size,
             player_names, cart_required, confirmed
      FROM tee_times
      WHERE club_id = ${club_id}
        AND member_id = ${member_id}
        AND tee_date BETWEEN ${date_from} AND ${date_to}
      ORDER BY tee_date DESC, tee_time DESC
      LIMIT ${limit}
    `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
