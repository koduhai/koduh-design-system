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
