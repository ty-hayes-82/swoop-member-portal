/**
 * Jonas MCP Server — read-only.
 *
 * Exposes member, round, POS, event, and household data from the Jonas
 * Club Management System. No write tools. Credentials never leave this process.
 *
 * Run: npx tsx mcp/jonas/server.ts
 * Transport: stdio (Managed Agents connects via stdio)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getVaultCredential } from '../../vaults/schema.ts';

// Validate credentials are present at startup
getVaultCredential('jonas_api_key');

const server = new McpServer({ name: 'jonas', version: '1.0.0' });

// ---------------------------------------------------------------------------
// Tool: query_members
// ---------------------------------------------------------------------------

server.tool(
  'query_members',
  'Query active members for a club. Returns member profiles with dues, status, join date, and household info.',
  {
    club_id: z.string().describe('Club ID'),
    status: z.enum(['active', 'inactive', 'resigned']).optional().default('active'),
    limit: z.number().int().min(1).max(500).optional().default(100),
    offset: z.number().int().min(0).optional().default(0),
  },
  async ({ club_id, status, limit, offset }) => {
    const result = await sql`
      SELECT member_id, member_number, first_name, last_name,
             member_type_code, annual_dues, join_date, status,
             household_id, email, phone
      FROM members
      WHERE club_id = ${club_id} AND status = ${status}
      ORDER BY last_name, first_name
      LIMIT ${limit} OFFSET ${offset}
    `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: query_rounds
// ---------------------------------------------------------------------------

server.tool(
  'query_rounds',
  'Query golf rounds for a club within a date range.',
  {
    club_id: z.string(),
    member_id: z.string().optional().describe('Filter to one member'),
    date_from: z.string().describe('ISO date YYYY-MM-DD'),
    date_to: z.string().describe('ISO date YYYY-MM-DD'),
    limit: z.number().int().min(1).max(1000).optional().default(200),
  },
  async ({ club_id, member_id, date_from, date_to, limit }) => {
    const result = member_id
      ? await sql`
          SELECT r.round_id, r.member_id, r.tee_time_date, r.course_played,
                 r.cart_type, r.tee_set, r.num_players
          FROM rounds r
          WHERE r.club_id = ${club_id}
            AND r.member_id = ${member_id}
            AND r.tee_time_date BETWEEN ${date_from} AND ${date_to}
          ORDER BY r.tee_time_date DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT r.round_id, r.member_id, r.tee_time_date, r.course_played,
                 r.cart_type, r.tee_set, r.num_players
          FROM rounds r
          WHERE r.club_id = ${club_id}
            AND r.tee_time_date BETWEEN ${date_from} AND ${date_to}
          ORDER BY r.tee_time_date DESC
          LIMIT ${limit}
        `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: query_pos_transactions
// ---------------------------------------------------------------------------

server.tool(
  'query_pos_transactions',
  'Query POS / dining transactions for a club. Returns check totals, outlet, covers, and server.',
  {
    club_id: z.string(),
    member_id: z.string().optional(),
    date_from: z.string().describe('ISO date'),
    date_to: z.string().describe('ISO date'),
    outlet: z.string().optional().describe('Filter to specific outlet'),
    limit: z.number().int().min(1).max(1000).optional().default(200),
  },
  async ({ club_id, member_id, date_from, date_to, outlet, limit }) => {
    const result = member_id
      ? await sql`
          SELECT transaction_id, member_id, outlet_id, visit_date,
                 check_total, covers, server_id
          FROM pos_transactions
          WHERE club_id = ${club_id}
            AND member_id = ${member_id}
            AND visit_date BETWEEN ${date_from} AND ${date_to}
          ORDER BY visit_date DESC
          LIMIT ${limit}
        `
      : outlet
        ? await sql`
            SELECT transaction_id, member_id, outlet_id, visit_date,
                   check_total, covers, server_id
            FROM pos_transactions
            WHERE club_id = ${club_id}
              AND outlet_id = ${outlet}
              AND visit_date BETWEEN ${date_from} AND ${date_to}
            ORDER BY visit_date DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT transaction_id, member_id, outlet_id, visit_date,
                   check_total, covers, server_id
            FROM pos_transactions
            WHERE club_id = ${club_id}
              AND visit_date BETWEEN ${date_from} AND ${date_to}
            ORDER BY visit_date DESC
            LIMIT ${limit}
          `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: read_events
// ---------------------------------------------------------------------------

server.tool(
  'read_events',
  'Read upcoming and past club events with attendance data.',
  {
    club_id: z.string(),
    date_from: z.string().describe('ISO date'),
    date_to: z.string().describe('ISO date'),
  },
  async ({ club_id, date_from, date_to }) => {
    const result = await sql`
      SELECT event_id, event_name, event_date, event_type,
             capacity, registrations, revenue
      FROM club_events
      WHERE club_id = ${club_id}
        AND event_date BETWEEN ${date_from} AND ${date_to}
      ORDER BY event_date
    `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: read_household
// ---------------------------------------------------------------------------

server.tool(
  'read_household',
  'Read household members for a given household ID.',
  {
    club_id: z.string(),
    household_id: z.string(),
  },
  async ({ club_id, household_id }) => {
    const result = await sql`
      SELECT member_id, first_name, last_name, relationship_code,
             member_type_code, status
      FROM members
      WHERE club_id = ${club_id} AND household_id = ${household_id}
      ORDER BY relationship_code
    `;
    return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
