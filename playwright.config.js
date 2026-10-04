import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 45_000,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true },
  reporter: 'list',
  webServer: { command: 'npm start', url: 'http://127.0.0.1:4173/api/health', reuseExistingServer: !process.env.CI, timeout: 20_000 },
});
