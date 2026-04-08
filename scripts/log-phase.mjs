#!/usr/bin/env node
/**
 * log-phase.mjs — Append a timestamped entry to test-results/phase-log.md
 * Usage: node scripts/log-phase.mjs "Phase 1" "milestone" "message here"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, '../test-results/phase-log.md');

const [,, phase, type, ...msgParts] = process.argv;
const msg = msgParts.join(' ');
const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const icons = {
  start: '🚀',
  capture: '📸',
  critique: '🔍',
  fix: '🔧',
  verify: '✅',
  fail: '❌',
  done: '✔️',
  summary: '📊',
};

const icon = icons[type] || '•';
const line = `${icon} **${time}** [${phase}] ${msg}\n\n`;

fs.appendFileSync(LOG_PATH, line);
console.log(`${icon} [${phase}] ${msg}`);
