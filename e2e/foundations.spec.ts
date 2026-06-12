import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STORY_URL = '/iframe.html?id=foundations-icons--gallery&viewMode=story';

// Storybook iframes are story fragments — they intentionally lack page-level
// structural elements (<main> landmark, <h1>) that axe flags as best-practice
// issues. `region` (all content must sit inside a landmark) is the same class of
// document-level finding — it fires on the gallery's non-interactive label text
// purely because the fragment has no page landmark. Disable these so we test the
// icon code itself (each icon is a role=img with an accessible title).
const DISABLED_RULES = ['landmark-one-main', 'page-has-heading-one', 'region'];

for (const theme of ['dark', 'light'] as const) {
  test(`icon gallery has no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`${STORY_URL}&globals=theme:${theme}`);
    await page.locator('svg').first().waitFor();
    const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
    expect(results.violations).toEqual([]);
  });
}
