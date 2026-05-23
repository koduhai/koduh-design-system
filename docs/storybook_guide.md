# Storybook Guide

> **Document Owner:** Founder
> **Last Updated:** May 22, 2026
> **Status:** Living Document

---

## Overview

Storybook is the interactive documentation and development environment for the
design system. Every component has a `*.stories.tsx`, and the **Foundations**
section documents the design tokens (colors, typography, spacing) and the icon
set. Storybook is also the surface that the accessibility and visual-regression
e2e tests run against.

Storybook runs **locally** for now; public deployment will be added when the
system is more mature.

---

## Running Storybook

```bash
npm run storybook        # dev docs at http://localhost:6006
npm run build-storybook  # static build
```

> **Token build first.** Storybook's preview imports the generated
> `dist/theme.css` (the `--ku-*` variables). The `prestorybook` and
> `prebuild-storybook` npm hooks run `npm run build:tokens` automatically, so the
> file always exists before Storybook starts. If you ever hit a missing
> `theme.css` error (e.g. after editing config directly), run
> `npm run build:tokens` once.

---

## Technology

| Choice        | Details                                 |
| ------------- | --------------------------------------- |
| **Version**   | Storybook 10                            |
| **Framework** | `@storybook/react-vite`                 |
| **Addons**    | `@storybook/addon-a11y` (axe in-canvas) |
| **Format**    | CSF3 (`Meta` + `StoryObj`)              |

There is no MUI Dark Mode addon or `ThemeProvider` decorator — theming is done via
a `data-theme` attribute and a custom toolbar (below).

---

## Configuration

### `.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
```

Stories are discovered anywhere under `src/`, co-located with their component (or,
for tokens/icons, in `src/theme/` and `src/icons/`).

### `.storybook/preview.tsx` — theme toolbar + decorator

The preview defines a **theme toolbar** (`globalTypes.theme`) with `dark`/`light`
items, and a **decorator** that applies the chosen mode to
`document.documentElement` and wraps each story in `KoduhThemeProvider`
(with `disablePersistence` so the toolbar fully controls the mode):

```tsx
import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { KoduhThemeProvider } from '../src/provider';
import type { ColorMode } from '../src/theme';
import '../src/styles/reset.css';
import '../dist/theme.css'; // generated --ku-* variables

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme as ColorMode;
      useEffect(() => {
        document.documentElement.setAttribute('data-theme', mode);
      }, [mode]);
      return (
        <KoduhThemeProvider defaultMode={mode} disablePersistence>
          <div style={{ padding: 24, minHeight: '100vh' }}>
            <Story />
          </div>
        </KoduhThemeProvider>
      );
    },
  ],
  parameters: { backgrounds: { disable: true } },
};

export default preview;
```

The toolbar gives a **theme toggle** so you can preview any story in both themes;
backgrounds are disabled because the theme's `bg-*` tokens already supply the
surface color.

---

## Writing a Story

Stories use CSF3 and import the real component directly (no theme wrapper needed —
styling is CSS). Provide a `Default` story and a `Showcase` that spreads the
variants/tones/sizes:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Button' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="solid" tone="primary">
        Solid
      </Button>
      <Button variant="outline" tone="primary">
        Outline
      </Button>
      <Button variant="ghost" tone="primary">
        Ghost
      </Button>
      <Button tone="neutral">Neutral</Button>
      <Button tone="danger">Danger</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
```

### Rules

1. **One story file per component**, co-located in the component folder.
2. **CSF3** — `Meta` + `StoryObj`; import types from `@storybook/react-vite`.
3. **Export a `Default`** showing the component in its default state.
4. **Export a `Showcase`** exercising the widest variant/tone/size spread — this
   is the story the e2e suite targets for a11y and visual snapshots.
5. **Name stories clearly** — `Default`, `Showcase`, `Loading`, not `Story1`.
6. Use `--ku-*` variables for any inline demo styling so stories track the theme.

---

## Story Organization

The sidebar is driven by each `meta.title`:

```
Components/
├── Button
├── LoadingButton
├── Chip
├── Avatar
├── StatusBadge
└── Alert
Foundations/
├── Colors
├── Typography
├── Spacing
└── Icons
```

| `title` value        | Sidebar location     |
| -------------------- | -------------------- |
| `Components/Button`  | Components → Button  |
| `Foundations/Colors` | Foundations → Colors |
| `Foundations/Icons`  | Foundations → Icons  |

(Components beyond Phase 1 — `TextField`, `Card`, `AppBar`, etc. — get their
stories as they are built.)

---

## Foundations Stories

The **Foundations** section documents tokens visually, deriving values from the
source so the docs cannot drift:

- **Colors** (`src/theme/Colors.stories.tsx`) — renders a swatch per color token,
  reading the token names straight from `themes.dark.color` and resolving each as
  `var(--ku-color-<name>)`. Because the swatches use the CSS variables, the
  palette re-renders correctly when the theme toolbar is switched.
- **Typography** (`src/theme/Typography.stories.tsx`) — the type scale.
- **Spacing** (`src/theme/Spacing.stories.tsx`) — the `--ku-space-*` scale.
- **Icons** (`src/icons/Icons.stories.tsx`) — a gallery of the vendored set, each
  rendered with a `title` so it's exposed accessibly.

These are documentation-only stories (`Meta` with a `Foundations/*` title and no
`component`).

---

## Accessibility in Storybook

`@storybook/addon-a11y` runs axe-core **in-canvas**, surfacing violations in the
Accessibility tab as you develop — for every story, in whichever theme the toolbar
is set to.

### Automated enforcement (e2e)

Beyond the in-canvas addon, Playwright drives the story iframes and runs axe-core
headlessly in CI, in **both** themes. Zero violations are required to merge.

- `e2e/components.spec.ts` iterates each component's `Showcase` story over
  `['dark', 'light']`, navigating to
  `/iframe.html?id=<storyId>&viewMode=story&globals=theme:<theme>` and asserting
  no axe violations. The same loop also captures a **visual-regression snapshot**
  per story per theme.
- `e2e/foundations.spec.ts` does the same for the icon gallery.

Storybook iframes are story **fragments**, so a few document-level best-practice
rules that don't apply to fragments are disabled per spec — `landmark-one-main`,
`page-has-heading-one`, and (for non-interactive content) `region` — keeping the
checks focused on the component code rather than the missing page chrome.

```ts
const DISABLED_RULES = ['landmark-one-main', 'page-has-heading-one', 'region'];
// …
const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
expect(results.violations).toEqual([]);
```

Run the suite with:

```bash
npm run test:e2e   # Playwright auto-starts Storybook on :6006
```

---

## Future: Public Deployment

When ready, the static Storybook build (`npm run build-storybook`) will be
deployed via a GitHub Actions workflow. This is not active yet — Storybook is
local-only for now.

---

_This is a living document. Update it as the Storybook setup evolves._
