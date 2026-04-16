/**
 * api/connectors/index.js
 *
 * Barrel export for all vendor connector proxies.
 * Import from here — never import connector files directly in agent code.
 *
 * Usage:
 *   import { jonas, foretees } from '../connectors/index.js';
 *   const members = await jonas.fetchMembers(clubId, { status: 'active' });
 */

export * as jonas from './jonas.js';
export * as foretees from './foretees.js';
