#!/usr/bin/env node
// One-shot token swap for Swoop dark rollout (STYLING.md).
// Usage: node scripts/swoop-dark-swap.mjs [--dry] [path1 path2 ...]
// Walks the given paths, swapping light-theme Tailwind classes for swoop-* tokens.
// Conservative: only rewrites exact class tokens we know about; leaves bespoke bg-*/text-* alone.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DRY = process.argv.includes('--dry');
if (ROOTS.length === 0) {
  console.error('usage: node scripts/swoop-dark-swap.mjs [--dry] <path> [<path> ...]');
  process.exit(1);
}

// Pair order matters: more-specific tokens first (e.g. text-gray-900 before text-gray-800).
// Each pair is matched as a whole class token, so border-gray-200 never eats border-gray-2000.
const TOKEN_MAP = [
  // Backgrounds
  ['bg-white', 'bg-swoop-panel'],
  ['bg-gray-50', 'bg-swoop-row'],
  ['bg-gray-100', 'bg-swoop-row'],
  ['bg-gray-200', 'bg-swoop-border'],
  ['bg-gray-300', 'bg-swoop-border'],
  ['bg-gray-700', 'bg-swoop-row'],
  ['bg-gray-800', 'bg-swoop-row'],
  ['bg-gray-900', 'bg-swoop-canvas'],
  ['bg-gray-950', 'bg-swoop-canvas'],
  ['bg-black', 'bg-swoop-canvas'],
  ['bg-slate-50', 'bg-swoop-row'],
  ['bg-slate-100', 'bg-swoop-row'],
  ['bg-slate-900', 'bg-swoop-canvas'],
  ['bg-neutral-50', 'bg-swoop-row'],
  ['bg-neutral-100', 'bg-swoop-row'],
  ['bg-neutral-900', 'bg-swoop-canvas'],

  // Text
  ['text-black', 'text-swoop-text'],
  ['text-gray-950', 'text-swoop-text'],
  ['text-gray-900', 'text-swoop-text'],
  ['text-gray-800', 'text-swoop-text'],
  ['text-gray-700', 'text-swoop-text-2'],
  ['text-gray-600', 'text-swoop-text-muted'],
  ['text-gray-500', 'text-swoop-text-muted'],
  ['text-gray-400', 'text-swoop-text-label'],
  ['text-gray-300', 'text-swoop-text-ghost'],
  ['text-gray-200', 'text-swoop-text-ghost'],
  ['text-slate-900', 'text-swoop-text'],
  ['text-slate-800', 'text-swoop-text'],
  ['text-slate-700', 'text-swoop-text-2'],
  ['text-slate-600', 'text-swoop-text-muted'],
  ['text-slate-500', 'text-swoop-text-muted'],
  ['text-slate-400', 'text-swoop-text-label'],
  ['text-neutral-900', 'text-swoop-text'],
  ['text-neutral-700', 'text-swoop-text-2'],
  ['text-neutral-500', 'text-swoop-text-muted'],
  ['text-neutral-400', 'text-swoop-text-label'],

  // Borders
  ['border-gray-100', 'border-swoop-border-inset'],
  ['border-gray-200', 'border-swoop-border'],
  ['border-gray-300', 'border-swoop-border'],
  ['border-gray-400', 'border-swoop-border'],
  ['border-gray-500', 'border-swoop-border'],
  ['border-gray-600', 'border-swoop-border'],
  ['border-gray-700', 'border-swoop-border'],
  ['border-gray-800', 'border-swoop-border'],
  ['border-black', 'border-swoop-border'],
  ['border-slate-200', 'border-swoop-border'],
  ['border-slate-300', 'border-swoop-border'],
  ['border-neutral-200', 'border-swoop-border'],
  ['border-neutral-300', 'border-swoop-border'],

  // Hover / focus variants — just the bg/text ones, keep structure
  ['hover:bg-gray-50', 'hover:bg-swoop-row-hover'],
  ['hover:bg-gray-100', 'hover:bg-swoop-row-hover'],
  ['hover:bg-white', 'hover:bg-swoop-panel'],
  ['hover:text-gray-700', 'hover:text-swoop-text-2'],
  ['hover:text-gray-800', 'hover:text-swoop-text'],
  ['hover:text-gray-900', 'hover:text-swoop-text'],
  ['hover:border-gray-200', 'hover:border-swoop-border'],
  ['hover:border-gray-300', 'hover:border-swoop-border'],

  // Placeholder
  ['placeholder:text-gray-400', 'placeholder:text-swoop-text-label'],
  ['placeholder:text-gray-500', 'placeholder:text-swoop-text-muted'],

  // Divide
  ['divide-gray-100', 'divide-swoop-border-inset'],
  ['divide-gray-200', 'divide-swoop-border'],
];

// Dark: prefixed duplicates — can be dropped since the app is always-dark now.
// Pattern strips ` dark:anything` from class attributes (conservative: only tokens
// matching dark:<tailwind-token> without bracket syntax or whitespace).
const DARK_STRIP_RE = /\s+dark:[-:/\[\].a-zA-Z0-9%]+/g;

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', 'dist-site', 'test-results', 'playwright-report']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else {
      const ext = extname(name);
      if (ext === '.jsx' || ext === '.tsx' || ext === '.js' || ext === '.ts' || ext === '.html') out.push(p);
    }
  }
  return out;
}

function rewriteTokens(src) {
  let out = src;
  for (const [from, to] of TOKEN_MAP) {
    // Match whole class token: preceded by "/space/quote, followed by space/quote/backtick
    const re = new RegExp(`(?<=["'\`\\s])${from.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?=["'\`\\s])`, 'g');
    out = out.replace(re, to);
  }
  // Strip redundant dark: variants (always-dark mode).
  out = out.replace(DARK_STRIP_RE, '');
  return out;
}

let changed = 0;
let scanned = 0;
for (const root of ROOTS) {
  const files = walk(root);
  for (const f of files) {
    scanned++;
    const src = readFileSync(f, 'utf8');
    const next = rewriteTokens(src);
    if (next !== src) {
      changed++;
      if (!DRY) writeFileSync(f, next);
      console.log(`${DRY ? '[dry] ' : ''}rewrote ${f}`);
    }
  }
}
console.log(`\n${DRY ? '[dry] ' : ''}${changed}/${scanned} files changed`);
