import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/14-insights-capture*', '**/15-vision-capture*'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 8,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5173',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      // 2026-04-09 wave 16: desktop project must NOT run mobile-specific
      // walkthroughs (they expect a 390px viewport, mobile shell, touch
      // events). Caught by e2e triage agent — desktop was failing 3 mobile
      // walkthrough specs because they were never scoped.
      testIgnore: [
        '**/mobile-conference-walkthrough.spec.js',
        '**/mobile-on-premise-walkthrough.spec.js',
        '**/mobile-button-audit.spec.js',
      ],
    },
    // 2026-04-09 wave 12: iPhone 13 emulator profile so GM agents can audit
    // the conference demo (#/m/conference) and the on-premise lookup
    // (#/m/members) in a real mobile viewport with touch events. Used by
    // tests under tests/e2e/mobile-* and ad-hoc GM-agent walkthroughs.
    //
    // 2026-04-09 wave 16: scope iPhone 13 to ONLY mobile-specific specs.
    // The full desktop suite was running here too and ~140 specs failed
    // because they click sidebar nav buttons that are hidden behind the
    // mobile hamburger drawer. Root cause is the missing mobile-nav test
    // helper, but the immediate fix is to stop running desktop tests on
    // a phone viewport. Triage report in §11.5 / wave 16 commit.
    {
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
      testMatch: [
        '**/mobile-*.spec.js',
      ],
    },
  ],
});
