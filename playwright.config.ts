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
  projects: [
    // Chromium runs the whole suite (axe + visual snapshots + interactions).
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The overlay JS-positioning fallback (Popover/Select/Menu/Tooltip) only runs
    // on engines WITHOUT CSS anchor positioning, so it is untested by Chromium
    // alone (this was the #34 class of bug). Cover it on WebKit + Firefox, but only
    // for the cross-browser interaction/positioning spec: axe is engine-agnostic
    // and the visual snapshots are Chromium-linux baselines, so those stay
    // Chromium-only.
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/interactions.spec.ts',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/interactions.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run storybook -- --ci --quiet',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
