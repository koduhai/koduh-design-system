import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:6006',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run storybook -- --ci --quiet',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
