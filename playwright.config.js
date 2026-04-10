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
      // Desktop project: exclude mobile-only walkthroughs (they expect a
      // 390px viewport + touch events).
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        '**/mobile-conference-walkthrough.spec.js',
        '**/mobile-on-premise-walkthrough.spec.js',
        '**/mobile-button-audit.spec.js',
      ],
    },
    {
      // iPhone 13: mobile specs only. Running the full desktop suite here
      // produces ~140 false failures because sidebar nav is hidden behind
      // the hamburger drawer.
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
      testMatch: ['**/mobile-*.spec.js'],
    },
  ],
});
