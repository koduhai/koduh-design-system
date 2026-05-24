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
  { name: 'TextField', storyId: 'components-textfield--showcase' },
  { name: 'Card', storyId: 'components-card--showcase' },
  { name: 'EmptyState', storyId: 'components-emptystate--showcase' },
  { name: 'PageHeader', storyId: 'components-pageheader--showcase' },
  { name: 'AppBar', storyId: 'components-appbar--showcase' },
  { name: 'Sidebar', storyId: 'components-sidebar--showcase' },
  { name: 'Checkbox', storyId: 'components-checkbox--showcase' },
  { name: 'Radio', storyId: 'components-radio--showcase' },
  { name: 'Switch', storyId: 'components-switch--showcase' },
  { name: 'Spinner', storyId: 'components-spinner--showcase' },
  { name: 'Skeleton', storyId: 'components-skeleton--showcase' },
  { name: 'Divider', storyId: 'components-divider--showcase' },
  { name: 'Accordion', storyId: 'components-accordion--showcase' },
  { name: 'Breadcrumbs', storyId: 'components-breadcrumbs--showcase' },
  { name: 'Tabs', storyId: 'components-tabs--showcase' },
  { name: 'Dialog', storyId: 'components-dialog--showcase' },
  { name: 'Snackbar', storyId: 'components-snackbar--showcase' },
  { name: 'Popover', storyId: 'components-popover--showcase' },
  { name: 'Tooltip', storyId: 'components-tooltip--showcase' },
  // Select/Menu floating content is closed until interaction; the harness opens
  // the first trigger so axe inspects the rendered listbox/menu (see gotoStory).
  { name: 'Select', storyId: 'components-select--showcase', open: true },
  { name: 'Menu', storyId: 'components-menu--showcase', open: true },
  { name: 'Textarea', storyId: 'components-textarea--showcase' },
  { name: 'Progress', storyId: 'components-progress--showcase' },
  { name: 'Pagination', storyId: 'components-pagination--showcase' },
  { name: 'Table', storyId: 'components-table--showcase' },
  { name: 'DataTable', storyId: 'components-datatable--showcase' },
  // v2 issues #13/#14/#15
  { name: 'Stack', storyId: 'components-stack--showcase' },
  { name: 'Inline', storyId: 'components-inline--showcase' },
  { name: 'Grid', storyId: 'components-grid--showcase' },
  { name: 'Container', storyId: 'components-container--showcase' },
  { name: 'Text', storyId: 'components-text--showcase' },
  { name: 'Heading', storyId: 'components-heading--showcase' },
  { name: 'Link', storyId: 'components-link--showcase' },
  { name: 'Toaster', storyId: 'components-toaster--showcase' },
  { name: 'FormField', storyId: 'components-formfield--showcase' },
  { name: 'NumberField', storyId: 'components-numberfield--showcase' },
  { name: 'Slider', storyId: 'components-slider--showcase' },
  { name: 'TagInput', storyId: 'components-taginput--showcase' },
  // Combobox's trigger is an <input role="combobox">, not a button, so the
  // button-click openFloating helper doesn't apply; the closed combobox input
  // is fully accessible on its own. Listbox a11y is covered by unit tests.
  { name: 'Combobox', storyId: 'components-combobox--showcase' },
  { name: 'Box', storyId: 'components-box--showcase' },
  { name: 'DescriptionList', storyId: 'components-descriptionlist--showcase' },
  // issue #12
  { name: 'AvatarGroup', storyId: 'components-avatargroup--showcase' },
  { name: 'Stat', storyId: 'components-stat--showcase' },
  { name: 'ToggleGroup', storyId: 'components-togglegroup--showcase' },
  { name: 'Drawer', storyId: 'components-drawer--showcase' },
] as const;

function storyUrl(storyId: string, theme: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
}

async function gotoStory(page: import('@playwright/test').Page, storyId: string, theme: string) {
  await page.goto(storyUrl(storyId, theme));
  // Storybook renders into #storybook-root; wait for the story body to paint.
  // Wait for a rendered element child rather than text — some components
  // (e.g. Skeleton) render only decorative, text-free nodes, which a
  // text-based emptiness check would wrongly treat as "not yet rendered".
  await page.locator('#storybook-root').waitFor();
  await expect(page.locator('#storybook-root > *').first()).toBeAttached();
}

// Open a floating component (Select/Menu) by clicking its first trigger, then
// wait for the popup to render so axe/visual capture the live listbox/menu.
async function openFloating(page: import('@playwright/test').Page) {
  await page.locator('#storybook-root button').first().click();
  await page.locator('[role="listbox"], [role="menu"]').first().waitFor();
}

for (const component of COMPONENTS) {
  const { name, storyId } = component;
  const shouldOpen = 'open' in component && component.open;
  for (const theme of THEMES) {
    test(`${name} has no axe violations (${theme})`, async ({ page }) => {
      await gotoStory(page, storyId, theme);
      if (shouldOpen) await openFloating(page);
      const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
      expect(results.violations).toEqual([]);
    });

    test(`${name} matches visual snapshot (${theme})`, async ({ page }) => {
      await gotoStory(page, storyId, theme);
      if (shouldOpen) await openFloating(page);
      // Animations are disabled by toHaveScreenshot by default.
      await expect(page).toHaveScreenshot(`${storyId}-${theme}.png`);
    });
  }
}

// Regression guard for #34: an invalid position-area (physical + logical keyword
// mix) computed to `none`, so the overlay fell back to inset:0 and rendered at
// the viewport top-left instead of anchored to its trigger. Assert an opened
// Select's listbox starts at/below its trigger, not pinned to the origin.
test('open overlay is anchored to its trigger, not the viewport origin (#34)', async ({ page }) => {
  await gotoStory(page, 'components-select--showcase', 'dark');
  const trigger = page.locator('#storybook-root button').first();
  await trigger.click();
  const listbox = page.locator('[role="listbox"]').first();
  await listbox.waitFor();
  const t = await trigger.boundingBox();
  const l = await listbox.boundingBox();
  expect(t, 'trigger has a bounding box').not.toBeNull();
  expect(l, 'listbox has a bounding box').not.toBeNull();
  if (t && l) {
    // Broken state: l.y === 0 (pinned to top). Valid bottom placement: l.y ≈ trigger bottom.
    expect(l.y).toBeGreaterThanOrEqual(t.y - 1);
  }
});
