import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  // HTML report (never auto-opens) so CI can upload it as an artifact on failure.
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  expect: {
    // Allow a small tolerance so anti-aliasing / sub-pixel rendering differences
    // don't fail otherwise-identical themed snapshots.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
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
