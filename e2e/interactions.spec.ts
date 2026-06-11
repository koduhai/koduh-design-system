import { test, expect } from '@playwright/test';

// Browser-only interaction tests for behavior jsdom cannot exercise (audit
// follow-up #65). The unit suite asserts the mechanism; these confirm it in real
// Chromium, where the two High audit fixes actually matter:
//  - NumberField uses type="text" because a number input sanitizes its value,
//    which would destroy the raw-text buffer (intermediate/trailing decimals).
//  - ConfirmDialog blocks the native <dialog> cancel (Esc) while confirmLoading.

function storyUrl(storyId: string, theme = 'dark'): string {
  return `/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
}

async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(storyUrl(storyId));
  await page.locator('#storybook-root').waitFor();
  await expect(page.locator('#storybook-root > *').first()).toBeAttached();
}

test('NumberField preserves a trailing/zero-padded decimal (no number-input sanitization)', async ({
  page,
}) => {
  await gotoStory(page, 'components-numberfield--default');
  const input = page.getByLabel('Quantity');
  // A trailing dot is the killer case: a type="number" input coerces "3." to ""
  // or "3" in real browsers; the text buffer keeps it verbatim.
  await input.fill('3.');
  await expect(input).toHaveValue('3.');
  // A zero-padded decimal likewise survives instead of being normalized.
  await input.fill('1.50');
  await expect(input).toHaveValue('1.50');
});

test('ConfirmDialog cannot be dismissed with Esc while confirmLoading', async ({ page }) => {
  await gotoStory(page, 'components-dialog--loading-locked');
  const dialog = page.locator('dialog');
  await expect(dialog).toBeVisible();
  // The confirm button is busy, confirming we are in the loading (locked) state.
  await expect(dialog.locator('button[aria-busy="true"]')).toBeVisible();
  // Esc routes through the native <dialog> cancel, which the component blocks
  // while loading; the dialog must stay open (the bug left it stuck closed).
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
});
