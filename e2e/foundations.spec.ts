import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STORY_URL = '/iframe.html?id=foundations-icons--gallery&viewMode=story';

// Storybook iframes are story fragments — they intentionally lack page-level
// structural elements (<main> landmark, <h1>) that axe flags as best-practice
// issues. Disable those two document-level rules so we test the component code.
const DISABLED_RULES = ['landmark-one-main', 'page-has-heading-one'];

for (const theme of ['dark', 'light'] as const) {
  test(`icon gallery has no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`${STORY_URL}&globals=theme:${theme}`);
    await page.locator('svg').first().waitFor();
    const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
    expect(results.violations).toEqual([]);
  });
}
