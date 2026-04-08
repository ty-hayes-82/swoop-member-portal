import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/combinations',
  testMatch: '15-vision-capture.spec.js',
  fullyParallel: true,
  workers: 8,
  reporter: [['list']],
  timeout: 120000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
