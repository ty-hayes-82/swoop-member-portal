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
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    // 2026-04-09 wave 12: iPhone 13 emulator profile so GM agents can audit
    // the conference demo (#/m/conference) and the on-premise lookup
    // (#/m/members) in a real mobile viewport with touch events. Used by
    // tests under tests/e2e/mobile-* and ad-hoc GM-agent walkthroughs.
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
  ],
});
