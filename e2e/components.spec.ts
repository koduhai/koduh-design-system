import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Storybook iframes are story fragments — they intentionally lack page-level
// structural elements (<main> landmark, <h1>, content regions) that axe flags
// as document-level best-practice issues. These have nothing to do with the
// component under test, so we disable them and keep the component-level checks.
// `region` is included for stories whose root content is non-interactive
// (e.g. Chip/Avatar): without a page landmark, axe flags the bare content.
const DISABLED_RULES = ['landmark-one-main', 'page-has-heading-one', 'region'];

const THEMES = ['dark', 'light'] as const;

// Representative story per component. The Showcase stories exercise the widest
// spread of variants/tones/sizes, so they make the best a11y + visual targets.
const COMPONENTS = [
  { name: 'Button', storyId: 'components-button--showcase' },
  { name: 'LoadingButton', storyId: 'components-loadingbutton--showcase' },
  { name: 'Chip', storyId: 'components-chip--showcase' },
  { name: 'Avatar', storyId: 'components-avatar--showcase' },
  { name: 'StatusBadge', storyId: 'components-statusbadge--showcase' },
  { name: 'Alert', storyId: 'components-alert--showcase' },
] as const;

function storyUrl(storyId: string, theme: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
}

async function gotoStory(page: import('@playwright/test').Page, storyId: string, theme: string) {
  await page.goto(storyUrl(storyId, theme));
  // Storybook renders into #storybook-root; wait for the story body to paint.
  await page.locator('#storybook-root').waitFor();
  await expect(page.locator('#storybook-root')).not.toBeEmpty();
}

for (const { name, storyId } of COMPONENTS) {
  for (const theme of THEMES) {
    test(`${name} has no axe violations (${theme})`, async ({ page }) => {
      await gotoStory(page, storyId, theme);
      const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
      expect(results.violations).toEqual([]);
    });

    test(`${name} matches visual snapshot (${theme})`, async ({ page }) => {
      await gotoStory(page, storyId, theme);
      // Animations are disabled by toHaveScreenshot by default.
      await expect(page).toHaveScreenshot(`${storyId}-${theme}.png`);
    });
  }
}
