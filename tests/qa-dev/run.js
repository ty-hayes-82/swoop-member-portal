#!/usr/bin/env node
/**
 * QA-Dev Autonomous Loop Runner
 *
 * Runs E2E tests, parses failures, outputs structured bug list.
 * Designed to be called by Claude Code which then dispatches fix agents.
 *
 * Usage:
 *   node tests/qa-dev/run.js                    # all layers
 *   node tests/qa-dev/run.js --layer=unit       # unit tests only
 *   node tests/qa-dev/run.js --layer=api        # API tests only
 *   node tests/qa-dev/run.js --layer=e2e        # E2E tests only
 *   node tests/qa-dev/run.js --layer=e2e --test=06  # specific E2E test
 *
 * Output (stdout, parseable):
 *   ---
 *   layer: unit
 *   total: 45
 *   passed: 42
 *   failed: 3
 *   failures:
 *   - test_id: agentService.test.js:28
 *     name: getAgentActions returns pending actions
 *     error: Expected 3 but received 0
 *     file_hint: src/services/agentService.js
 *     severity: high
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const args = process.argv.slice(2);
const layerArg = args.find(a => a.startsWith('--layer='))?.split('=')[1] || 'all';
const testFilter = args.find(a => a.startsWith('--test='))?.split('=')[1] || null;

mkdirSync(resolve(ROOT, 'test-results'), { recursive: true });

// ---------------------------------------------------------------------------
// Layer 1: Vitest unit tests
// ---------------------------------------------------------------------------
function runUnitTests() {
  console.error('[QA-Dev] Running unit tests...');
  try {
    const result = execSync('npx vitest run --reporter=json 2>/dev/null', {
      cwd: ROOT, timeout: 120000, encoding: 'utf-8',
    });

    // Parse Vitest JSON output
    const jsonStart = result.indexOf('{');
    if (jsonStart < 0) return { layer: 'unit', total: 0, passed: 0, failed: 0, failures: [] };

    const data = JSON.parse(result.slice(jsonStart));
    const failures = [];

    for (const file of (data.testResults || [])) {
      for (const test of (file.assertionResults || [])) {
        if (test.status === 'failed') {
          const testFile = file.name.replace(ROOT + '/', '').replace(ROOT + '\\', '');
          failures.push({
            test_id: `${testFile}:${test.ancestorTitles?.join(' > ')} > ${test.title}`,
            name: test.title,
            error: (test.failureMessages || []).join('\n').slice(0, 500),
            file_hint: inferSourceFile(testFile),
            severity: 'high',
          });
        }
      }
    }

    const total = data.numTotalTests || 0;
    const passed = data.numPassedTests || 0;
    const failed = data.numFailedTests || 0;

    return { layer: 'unit', total, passed, failed, failures };
  } catch (err) {
    // Vitest exits non-zero on failures — parse output anyway
    const output = err.stdout || '';
    const jsonStart = output.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const data = JSON.parse(output.slice(jsonStart));
        const failures = [];
        for (const file of (data.testResults || [])) {
          for (const test of (file.assertionResults || [])) {
            if (test.status === 'failed') {
              const testFile = file.name.replace(ROOT + '/', '').replace(ROOT + '\\', '');
              failures.push({
                test_id: `${testFile}:${test.title}`,
                name: test.title,
                error: (test.failureMessages || []).join('\n').slice(0, 500),
                file_hint: inferSourceFile(testFile),
                severity: 'high',
              });
            }
          }
        }
        return { layer: 'unit', total: data.numTotalTests || 0, passed: data.numPassedTests || 0, failed: data.numFailedTests || 0, failures };
      } catch {}
    }
    return { layer: 'unit', total: 0, passed: 0, failed: 0, failures: [{ test_id: 'vitest', name: 'vitest runner', error: err.message.slice(0, 500), file_hint: '', severity: 'critical' }] };
  }
}

// ---------------------------------------------------------------------------
// Layer 2: API endpoint tests
// ---------------------------------------------------------------------------
function runApiTests() {
  console.error('[QA-Dev] Running API tests...');
  const apiTestFile = resolve(__dirname, 'api-tests.js');
  if (!existsSync(apiTestFile)) {
    console.error('[QA-Dev] api-tests.js not found, skipping API layer');
    return { layer: 'api', total: 0, passed: 0, failed: 0, failures: [] };
  }

  try {
    const result = execSync(`node ${apiTestFile}`, { cwd: ROOT, timeout: 180000, encoding: 'utf-8' });
    const jsonStart = result.indexOf('{');
    if (jsonStart >= 0) return JSON.parse(result.slice(jsonStart));
    return { layer: 'api', total: 0, passed: 0, failed: 0, failures: [] };
  } catch (err) {
    return { layer: 'api', total: 0, passed: 0, failed: 0, failures: [{ test_id: 'api-runner', name: 'API test runner', error: err.message.slice(0, 500), file_hint: '', severity: 'critical' }] };
  }
}

// ---------------------------------------------------------------------------
// Layer 3: Playwright E2E tests
// ---------------------------------------------------------------------------
function runE2eTests() {
  console.error('[QA-Dev] Running E2E tests...');
  const testArg = testFilter ? `tests/e2e/combinations/${testFilter}*.spec.js` : '';

  try {
    execSync(`npx playwright test ${testArg} --reporter=json 2>/dev/null`, {
      cwd: ROOT, timeout: 600000, encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {}

  // Parse results.json (written by Playwright JSON reporter)
  const resultsFile = resolve(ROOT, 'test-results/results.json');
  if (!existsSync(resultsFile)) {
    return { layer: 'e2e', total: 0, passed: 0, failed: 0, failures: [{ test_id: 'playwright', name: 'Playwright runner', error: 'No results.json generated', file_hint: '', severity: 'critical' }] };
  }

  const data = JSON.parse(readFileSync(resultsFile, 'utf-8'));
  const failures = [];
  let total = 0, passed = 0, failed = 0;

  function walkSuites(suites) {
    for (const suite of (suites || [])) {
      for (const spec of (suite.specs || [])) {
        total++;
        if (spec.ok) { passed++; continue; }
        failed++;

        const result = spec.tests?.[0]?.results?.[0] || {};
        const errorMsg = result.errors?.map(e => e.message || e.stack || '').join('\n').slice(0, 500) || 'Unknown error';
        const testFile = suite.file || '';

        failures.push({
          test_id: `${testFile}:${spec.line || 0}`,
          name: spec.title,
          error: errorMsg,
          file_hint: inferSourceFileFromE2e(testFile, errorMsg),
          severity: errorMsg.includes('timeout') ? 'medium' : 'high',
        });
      }
      walkSuites(suite.suites);
    }
  }

  walkSuites(data.suites);
  return { layer: 'e2e', total, passed, failed, failures };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function inferSourceFile(testFile) {
  // Map test file → likely source file
  // tests/agents/phase1-member-risk.test.js → api/agents/risk-trigger.js
  // src/services/agentService.test.js → src/services/agentService.js
  return testFile
    .replace('.test.js', '.js')
    .replace('.spec.js', '.js')
    .replace('tests/agents/', 'api/agents/')
    .replace('tests/', 'src/');
}

function inferSourceFileFromE2e(testFile, error) {
  // Try to extract source file from stack trace or test name
  if (testFile.includes('agents')) return 'src/features/agents/';
  if (testFile.includes('members')) return 'src/features/members/';
  if (testFile.includes('fb')) return 'src/features/revenue/';
  if (testFile.includes('teesheet')) return 'src/features/tee-sheet/';
  if (testFile.includes('complaints')) return 'src/features/service/';
  if (testFile.includes('tenant')) return 'api/lib/withAuth.js';
  return '';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const results = [];

  if (layerArg === 'all' || layerArg === 'unit') {
    results.push(runUnitTests());
  }
  if (layerArg === 'all' || layerArg === 'api') {
    results.push(runApiTests());
  }
  if (layerArg === 'all' || layerArg === 'e2e') {
    results.push(runE2eTests());
  }

  // Summary to stderr
  for (const r of results) {
    console.error(`[${r.layer}] ${r.passed}/${r.total} passed, ${r.failed} failed`);
  }

  const totalFailed = results.reduce((s, r) => s + r.failed, 0);
  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalTests = results.reduce((s, r) => s + r.total, 0);
  const allFailures = results.flatMap(r => r.failures.map(f => ({ ...f, layer: r.layer })));

  console.error(`\n[QA-Dev] Total: ${totalPassed}/${totalTests} passed, ${totalFailed} failed, ${allFailures.length} failure records`);

  // Structured output to stdout (parseable)
  console.log('---');
  console.log(`total_tests: ${totalTests}`);
  console.log(`total_passed: ${totalPassed}`);
  console.log(`total_failed: ${totalFailed}`);
  console.log(`pass_rate: ${totalTests ? (totalPassed / totalTests * 100).toFixed(1) : 0}%`);

  if (allFailures.length > 0) {
    console.log('failures:');
    for (const f of allFailures) {
      console.log(`  - layer: ${f.layer}`);
      console.log(`    test_id: ${f.test_id}`);
      console.log(`    name: ${f.name}`);
      console.log(`    error: ${f.error.split('\n')[0]}`);
      console.log(`    file_hint: ${f.file_hint}`);
      console.log(`    severity: ${f.severity}`);
    }
  }

  // Write full results to file for dev agents
  const fullResults = {
    timestamp: new Date().toISOString(),
    summary: { totalTests, totalPassed, totalFailed, passRate: totalTests ? (totalPassed / totalTests) : 0 },
    layers: results,
    failures: allFailures,
  };
  writeFileSync(resolve(ROOT, 'test-results/qa-dev-results.json'), JSON.stringify(fullResults, null, 2));

  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
