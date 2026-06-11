import { test, expect } from '@playwright/test';

// The cross-browser e2e suite (#65 + #40). These run on Chromium, WebKit, AND
// Firefox (see playwright.config.ts projects) because they cover behavior that is
// engine-specific and jsdom can't exercise:
//  - NumberField uses type="text" because a number input sanitizes its value,
//    which would destroy the raw-text buffer (intermediate/trailing decimals).
//  - ConfirmDialog blocks the native <dialog> cancel (Esc) while confirmLoading.
//  - Overlay positioning (#34): WebKit/Firefox lack CSS anchor positioning, so
//    they exercise the JS positioning fallback that Chromium never runs.

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

test('an opened overlay is anchored to its trigger, not the viewport origin (#34)', async ({
  page,
}) => {
  // Exercises the JS positioning fallback on WebKit/Firefox (no CSS anchor
  // positioning there). The #34 bug pinned the overlay to the viewport top-left.
  await gotoStory(page, 'components-select--showcase');
  const trigger = page.locator('#storybook-root button').first();
  await trigger.click();
  const listbox = page.locator('[role="listbox"]').first();
  await listbox.waitFor();
  const t = await trigger.boundingBox();
  const l = await listbox.boundingBox();
  expect(t, 'trigger has a bounding box').not.toBeNull();
  expect(l, 'listbox has a bounding box').not.toBeNull();
  if (t && l) {
    // Anchored bottom placement: the listbox sits at/below the trigger and shares
    // its horizontal range. A viewport-origin overlay (the #34 break) does neither.
    expect(l.y).toBeGreaterThanOrEqual(t.y - 1);
    expect(l.x).toBeLessThan(t.x + t.width);
    expect(t.x).toBeLessThan(l.x + l.width);
  }
});
