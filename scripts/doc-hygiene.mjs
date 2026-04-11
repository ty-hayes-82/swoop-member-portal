#!/usr/bin/env node
/**
 * doc-hygiene.mjs — Audit documentation health across the repo.
 *
 * Usage:  node scripts/doc-hygiene.mjs
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const EXCLUDE = new Set(['node_modules', '.git', '.claude', '.next', 'dist']);
const HEADER_KEYWORDS = ['generated:', 'branch:', 'commit:', 'date:', 'updated:'];
const LIVING_KEYWORDS = ['ROADMAP', 'ARCHITECTURE', 'DATA_MODEL', 'PLAN'];
const SNAPSHOT_KEYWORDS = ['AUDIT', 'REPORT', 'LOG', 'CHANGELOG'];
const STALE_DAYS = 30;

// ── helpers ────────────────────────────────────────────────────────────

async function collectMdFiles(dir, depth = 0) {
  const entries = await readdir(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (EXCLUDE.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory() && depth < 2) {
      // only recurse into docs/ (or one level of subdirs)
      if (depth === 0 && e.name === 'docs') {
        files = files.concat(await collectMdFiles(full, depth + 1));
      }
      // skip other dirs at root level; at depth 1 we're inside docs/ already
      if (depth === 1) {
        files = files.concat(await collectMdFiles(full, depth + 1));
      }
    }
    if (e.isFile() && e.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function hasSnapshotHeader(firstLines) {
  const lower = firstLines.map(l => l.toLowerCase());
  return HEADER_KEYWORDS.some(kw => lower.some(l => l.includes(kw)));
}

function classify(filename) {
  const upper = filename.toUpperCase();
  if (LIVING_KEYWORDS.some(k => upper.includes(k))) return 'living';
  if (SNAPSHOT_KEYWORDS.some(k => upper.includes(k))) return 'snapshot';
  return 'unknown';
}

function extractCodeRefs(content) {
  // Match backtick-wrapped paths that look like file references
  const refs = [];
  const regex = /`([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,6})`/g;
  let m;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    while ((m = regex.exec(lines[i])) !== null) {
      const ref = m[1];
      // only consider paths (must contain a slash)
      if (ref.includes('/') && !ref.startsWith('http')) {
        refs.push({ path: ref, line: i + 1 });
      }
    }
  }
  return refs;
}

function getLastCommitDate(filePath) {
  try {
    const out = execSync(`git log -1 --format=%ci "${relative(ROOT, filePath)}"`, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return out ? new Date(out) : null;
  } catch {
    return null;
  }
}

function fileExists(p) {
  try {
    return existsSync(resolve(ROOT, p));
  } catch {
    return false;
  }
}

function daysBetween(a, b) {
  return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

function pad(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

// ── main ───────────────────────────────────────────────────────────────

async function main() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const files = await collectMdFiles(ROOT);

  const results = [];

  for (const f of files) {
    const rel = relative(ROOT, f);
    const content = await readFile(f, 'utf-8');
    const lines = content.split('\n').slice(0, 10);
    const header = hasSnapshotHeader(lines);
    const type = classify(rel);
    const codeRefs = extractCodeRefs(content);
    const brokenRefs = codeRefs.filter(r => !fileExists(r.path));
    const lastCommit = getLastCommitDate(f);
    const daysOld = lastCommit ? daysBetween(lastCommit, today) : null;

    results.push({ rel, header, type, brokenRefs, lastCommit, daysOld });
  }

  // ── tallies ──
  const total = results.length;
  const withHeaders = results.filter(r => r.header).length;
  const living = results.filter(r => r.type === 'living').length;
  const snapshot = results.filter(r => r.type === 'snapshot').length;
  const unknown = results.filter(r => r.type === 'unknown').length;
  const missingHeaders = results.filter(r => !r.header);
  const allBroken = results.flatMap(r => r.brokenRefs.map(b => ({ doc: r.rel, ...b })));
  const stale = results.filter(r => r.daysOld !== null && r.daysOld >= STALE_DAYS);

  // ── output ──
  const sep = '='.repeat(40);
  console.log(`\nDOC HYGIENE REPORT — ${dateStr}`);
  console.log(sep);
  console.log(`Total docs: ${total}`);
  console.log(`With snapshot headers: ${withHeaders}/${total}`);
  console.log(`Living docs: ${living}`);
  console.log(`Snapshot docs: ${snapshot}`);
  console.log(`Unknown type: ${unknown}`);

  if (missingHeaders.length) {
    console.log(`\nMISSING HEADERS:`);
    for (const r of missingHeaders) {
      console.log(`  - ${r.rel} (no date stamp)`);
    }
  }

  if (allBroken.length) {
    console.log(`\nSTALE REFERENCES (file paths in docs that don't exist):`);
    for (const b of allBroken) {
      console.log(`  - ${b.doc}:${b.line} references \`${b.path}\` (not found)`);
    }
  }

  if (stale.length) {
    console.log(`\nREVIEW NEEDED (not updated in ${STALE_DAYS}+ days):`);
    for (const r of stale) {
      const d = r.lastCommit.toISOString().slice(0, 10);
      console.log(`  - ${r.rel} (last commit: ${d})`);
    }
  }

  // recommendations
  const recs = [];
  if (missingHeaders.length) recs.push(`Add snapshot headers to ${missingHeaders.length} docs`);
  if (allBroken.length) recs.push(`Fix ${allBroken.length} stale reference${allBroken.length > 1 ? 's' : ''}`);
  if (stale.length) recs.push(`Review ${stale.length} aging doc${stale.length > 1 ? 's' : ''}`);

  if (recs.length) {
    console.log(`\nRECOMMENDATIONS:`);
    recs.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  }

  if (!missingHeaders.length && !allBroken.length && !stale.length) {
    console.log(`\nAll docs look healthy!`);
  }

  console.log('');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
