#!/usr/bin/env node
/**
 * scripts/finalize-hardening.mjs
 *
 * Unified "is Swoop hardened end-to-end" driver. Runs:
 *   1. permutation-hardening.mjs --dry-run --permutations=10 --concurrency=5
 *   2. edge-case-matrix.mjs
 *
 * Consolidates both punch lists into reports/finalization-report.md.
 * Exits 0 only if BOTH steps pass.
 *
 * Usage:
 *   node scripts/finalize-hardening.mjs [--skip-perm] [--skip-edge]
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'reports', 'finalization-report.md');

const FLAGS = {
  skipPerm: process.argv.includes('--skip-perm'),
  skipEdge: process.argv.includes('--skip-edge'),
};

function runScript(args) {
  return new Promise(resolve => {
    const child = spawn('node', args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', code => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

function readReport(relPath) {
  try { return fs.readFileSync(path.join(ROOT, relPath), 'utf8'); }
  catch { return null; }
}

async function main() {
  const started = new Date();
  let permCode = 0;
  let edgeCode = 0;

  if (!FLAGS.skipPerm) {
    console.log('\n[finalize] Step 1: permutation hardening (10 perms, concurrency 5)\n');
    permCode = await runScript([
      'scripts/permutation-hardening.mjs',
      '--dry-run',
      '--permutations=10',
      '--concurrency=5',
    ]);
  } else {
    console.log('\n[finalize] Step 1: SKIPPED (--skip-perm)');
  }

  if (!FLAGS.skipEdge) {
    console.log('\n[finalize] Step 2: edge-case matrix\n');
    edgeCode = await runScript(['scripts/edge-case-matrix.mjs']);
  } else {
    console.log('\n[finalize] Step 2: SKIPPED (--skip-edge)');
  }

  const permPunch = readReport('reports/hardening-punch-list.md') || '(no punch list file)';
  const edgePunch = readReport('reports/edge-case-matrix.md') || '(no edge-case report file)';
  const allClean = permCode === 0 && edgeCode === 0;

  const ms = Date.now() - started.getTime();
  const lines = [
    `# Finalization Report — ${started.toISOString()}`,
    ``,
    `Total runtime: ${Math.round(ms / 1000)}s`,
    ``,
    allClean ? `## \ud83c\udf89 CLEAN — hardening passed end-to-end` : `## \u274c FAILED`,
    ``,
    `| Step | Result |`,
    `|------|--------|`,
    `| Permutation hardening (10×22) | ${permCode === 0 ? '\u2705 pass' : '\u274c exit ' + permCode} |`,
    `| Edge-case matrix               | ${edgeCode === 0 ? '\u2705 pass' : '\u274c exit ' + edgeCode} |`,
    ``,
    `---`,
    ``,
    `## Permutation Punch List`,
    ``,
    permPunch,
    ``,
    `---`,
    ``,
    `## Edge-Case Matrix`,
    ``,
    edgePunch,
  ];
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`\n[finalize] report: ${path.relative(ROOT, REPORT)}`);
  console.log(`[finalize] result: ${allClean ? 'CLEAN' : 'FAILED'}`);
  process.exit(allClean ? 0 : 1);
}

main().catch(err => {
  console.error('[finalize] CRASH:', err);
  process.exit(2);
});
