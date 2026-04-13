#!/usr/bin/env node
/**
 * scripts/click-tester.mjs
 *
 * Standalone Playwright driver that walks every GM-facing nav route
 * and captures:
 *   - pageerror events
 *   - console.error messages
 *   - network responses with status >= 400 on /api/*
 *   - elements with text "Loading..." / "Loading data..." that persist > 15s
 *   - elements with text "Error loading" / "Something went wrong"
 *
 * Used by scripts/permutation-hardening.mjs to verify every view renders
 * cleanly at partial-data states. Can also be run standalone for
 * one-shot QA.
 *
 * Usage (standalone):
 *   BASE_URL=http://localhost:5173 \
 *   TEST_CLUB_ID=e56ae6f7-e7cd-4198-8786-f2de9f813e17 \
 *     node scripts/click-tester.mjs
 *
 * Usage (programmatic, from permutation-hardening.mjs):
 *   import { runClickTest } from './click-tester.mjs';
 *   const { errors, screenshots } = await runClickTest({
 *     baseUrl: 'http://localhost:5173',
 *     clubId: 'e56ae6f7-...',
 *     label: 'step-3-transactions',
 *     reportDir: 'reports/permutation-pos-first',
 *   });
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// GM-visible routes driven by hash (#/<key>) per src/context/NavigationContext.jsx.
// Order matters: Today first since it's the default landing page.
const ROUTES = [
  { key: 'today',        label: 'Today' },
  { key: 'members',      label: 'Members' },
  { key: 'tee-sheet',    label: 'Tee Sheet' },
  { key: 'service',      label: 'Service' },
  { key: 'revenue',      label: 'Revenue' },
  { key: 'automations',  label: 'Automations' },
  { key: 'board-report', label: 'Board Report' },
  { key: 'admin',        label: 'Admin' },
  // Hidden but navigable:
  { key: 'insights',     label: 'Insights (hidden)' },
];

const PATTERNS = {
  stuckLoading: /^loading(\.\.\.|\s*$|…|$)/i,
  errorText:    /error loading|something went wrong|failed to (fetch|load)/i,
};

const LOADING_TIMEOUT_MS = 15000;

/**
 * @param {object} opts
 * @param {string} opts.baseUrl       - e.g. http://localhost:5173
 * @param {string} opts.clubId        - test club UUID to auth as
 * @param {string} opts.label         - short label for this run (used in filenames)
 * @param {string} opts.reportDir     - directory for screenshots + errors.json
 * @param {boolean} [opts.headless]   - default true
 * @returns {Promise<{routes: Array, totalErrors: number}>}
 */
export async function runClickTest(opts) {
  const { baseUrl, clubId, label, reportDir, headless = true } = opts;
  fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject a test-club auth token before any page load. Keys cribbed from
  // tests/e2e/b-lite-journey.spec.js, which uses the same localStorage
  // shape the real login flow writes.
  await context.addInitScript((injected) => {
    localStorage.setItem('swoop_auth_token', injected.token);
    localStorage.setItem('swoop_auth_user', JSON.stringify(injected.user));
    localStorage.setItem('swoop_club_id', injected.clubId);
    localStorage.setItem('swoop_club_name', injected.clubName);
  }, {
    token: 'click-tester-token',
    user: { id: 'click-tester', email: 'qa@swoopgolf.com', role: 'gm', clubId },
    clubId,
    clubName: 'QA Click Test Club',
  });

  const page = await context.newPage();
  const results = [];

  for (const route of ROUTES) {
    const errors = [];
    const networkErrors = [];

    const onPageError = (err) => errors.push({ type: 'pageerror', message: err.message });
    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console.error', message: msg.text().slice(0, 300) });
      }
    };
    const onResponse = (resp) => {
      const url = resp.url();
      if (url.includes('/api/') && resp.status() >= 400) {
        networkErrors.push({ url, status: resp.status() });
      }
    };

    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    page.on('response', onResponse);

    try {
      const targetUrl = `${baseUrl}/#/${route.key}`;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait briefly for any data fetches kicked off on mount.
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {
        // Some views (Today with live feeds) never reach idle. That's OK.
      }

      // Detect stuck loading states.
      const stuckLoader = await page.evaluate(({ pattern, timeoutMs }) => {
        const re = new RegExp(pattern.source, pattern.flags);
        const startTs = Date.now();
        return new Promise((resolve) => {
          const check = () => {
            const allText = document.body?.innerText || '';
            const hasLoading = re.test(allText);
            if (!hasLoading) return resolve({ stuck: false });
            if (Date.now() - startTs > timeoutMs) {
              return resolve({ stuck: true, matchedText: (allText.match(re) || [])[0] });
            }
            setTimeout(check, 500);
          };
          check();
        });
      }, { pattern: { source: PATTERNS.stuckLoading.source, flags: PATTERNS.stuckLoading.flags }, timeoutMs: LOADING_TIMEOUT_MS });

      if (stuckLoader.stuck) {
        errors.push({ type: 'stuckLoading', message: `Loading state persisted > 15s: "${stuckLoader.matchedText}"` });
      }

      // Detect explicit error text.
      const errorTextMatch = await page.evaluate(({ pattern }) => {
        const re = new RegExp(pattern.source, pattern.flags);
        const txt = document.body?.innerText || '';
        const m = txt.match(re);
        return m ? m[0] : null;
      }, { pattern: { source: PATTERNS.errorText.source, flags: PATTERNS.errorText.flags } });
      if (errorTextMatch) {
        errors.push({ type: 'errorText', message: errorTextMatch });
      }

      // Record network errors as structured items.
      for (const ne of networkErrors) {
        errors.push({ type: 'network', message: `${ne.status} ${ne.url}` });
      }

      // Screenshot after all assertions.
      const screenshotPath = path.join(reportDir, `${label}-${route.key}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        route: route.key,
        label: route.label,
        errors,
        screenshot: screenshotPath,
      });
    } catch (err) {
      results.push({
        route: route.key,
        label: route.label,
        errors: [{ type: 'navigation', message: err.message.slice(0, 300) }],
        screenshot: null,
      });
    } finally {
      page.removeListener('pageerror', onPageError);
      page.removeListener('console', onConsole);
      page.removeListener('response', onResponse);
    }
  }

  await context.close();
  await browser.close();

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  fs.writeFileSync(
    path.join(reportDir, `${label}-errors.json`),
    JSON.stringify({ label, totalErrors, routes: results }, null, 2),
  );

  return { routes: results, totalErrors };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
               import.meta.url.endsWith(path.basename(process.argv[1] || ''));

if (isMain) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const clubId = process.env.TEST_CLUB_ID || 'e56ae6f7-e7cd-4198-8786-f2de9f813e17';
  const label = process.env.LABEL || 'standalone';
  const reportDir = process.env.REPORT_DIR || 'reports/click-test';

  console.log(`[click-tester] ${baseUrl} club=${clubId.slice(0, 8)} label=${label}`);
  runClickTest({ baseUrl, clubId, label, reportDir })
    .then(({ totalErrors, routes }) => {
      console.log(`[click-tester] ${routes.length} routes, ${totalErrors} errors`);
      for (const r of routes) {
        const flag = r.errors.length === 0 ? '\u2713' : `\u2717 (${r.errors.length})`;
        console.log(`  ${flag} ${r.route}`);
        if (r.errors.length > 0) {
          r.errors.forEach(e => console.log(`     - ${e.type}: ${e.message.slice(0, 100)}`));
        }
      }
      process.exit(totalErrors === 0 ? 0 : 1);
    })
    .catch(err => {
      console.error('[click-tester] CRASH:', err);
      process.exit(2);
    });
}
