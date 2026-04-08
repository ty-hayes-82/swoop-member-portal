import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 8,
  reporter: [['list']],
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
  ],
});
