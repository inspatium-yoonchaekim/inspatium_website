import { defineConfig } from '@playwright/test';

const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 45_000,
  fullyParallel: false,
  use: { baseURL: deployedBaseURL || 'http://127.0.0.1:4173', channel: 'chrome', headless: true },
  reporter: 'list',
  webServer: deployedBaseURL ? undefined : { command: 'npm start', url: 'http://127.0.0.1:4173/api/health', reuseExistingServer: !process.env.CI, timeout: 20_000 },
});
