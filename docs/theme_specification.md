# Theme Specification

> **Document Owner:** Founder
> **Last Updated:** May 22, 2026
> **Status:** Living Document

---

## Overview

This document defines the Koduh AI design tokens — color, typography, spacing,
radii, shadows, z-index, breakpoints, and motion — and how they reach the screen.

There is **no `createTheme` / `ThemeProvider`** and no `theme` object threaded
through React context for styling. Instead:

1. A **single TypeScript source of truth** (`src/theme/tokens.ts`) declares every
   token.
2. A build script (`scripts/generate-theme-css.ts`) compiles those tokens into
   **CSS custom properties** prefixed `--ku-*`, emitted as `dist/theme.css`.
3. Components consume **only** the CSS variables (never the TS values at runtime).
4. `KoduhThemeProvider` switches between dark and light by setting a single
   `data-theme` attribute on `<html>`.

**Dark mode is the primary theme.** Light is the secondary option. There is no
multi-theme / white-label support.

---

## The Token Source of Truth

All tokens live in `src/theme/tokens.ts`, split into two exports:

- **`tokens`** — theme-independent scales (spacing, radii, type, shadows,
  z-index, breakpoints, motion). Identical in both themes.
- **`themes`** — the per-mode color values that differ between `dark` and
  `light`.

To change any value — a color, a spacing step, a radius — **edit `tokens.ts`
only**. Never hand-edit `dist/theme.css`; it carries a "do not edit" banner and is
overwritten on every build.

The tokens are also re-exported as typed TS objects from
`@koduhai/design-system/theme` for consumers who genuinely need a value in JS
(e.g. inline calculations, media queries). Components themselves do not import
them at runtime.

---

## Token Categories

The `--ku-*` variable name is derived from the token path by lowercasing and
inserting hyphens at camelCase boundaries (`bgDefault` → `bg-default`).

### Color (theme-dependent)

Defined separately for `dark` and `light` under `themes`. Generated as
`--ku-color-<name>`.

| Token (`--ku-color-…`) | Dark      | Light     | Usage                          |
| ---------------------- | --------- | --------- | ------------------------------ |
| `primary`              | `#5B9DFF` | `#1B5FCC` | Primary actions, links         |
| `primary-contrast`     | `#0A0E1A` | `#FFFFFF` | Text/icon on a primary surface |
| `danger`               | `#FF6B6B` | `#C62828` | Destructive / error            |
| `success`              | `#4ADE80` | `#1B7F3B` | Success, positive              |
| `warning`              | `#FBBF24` | `#9A6700` | Warnings, caution              |
| `info`                 | `#5B9DFF` | `#1B5FCC` | Informational                  |
| `bg-default`           | `#0A0E1A` | `#FFFFFF` | Page background                |
| `bg-surface`           | `#141A2A` | `#F4F6FA` | Cards, surfaces                |
| `bg-raised`            | `#1C2438` | `#FFFFFF` | Raised / elevated surfaces     |
| `border`               | `#2A3346` | `#D4DAE5` | Borders, dividers              |
| `text-primary`         | `#F5F7FA` | `#10141F` | Primary text                   |
| `text-secondary`       | `#A8B2C4` | `#4A5468` | Secondary text, labels         |
| `text-disabled`        | `#5C667A` | `#9AA3B5` | Disabled text                  |

### Spacing — `--ku-space-{n}` (4px base scale)

`1`=4px, `2`=8px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, `8`=32px, `10`=40px,
`12`=48px. Always reference a `--ku-space-*` variable; never hardcode a pixel
value.

### Radii — `--ku-radius-{sm|md|lg|full}`

`sm`=4px, `md`=8px (default for buttons/inputs/cards), `lg`=12px, `full`=9999px
(pills, avatars).

### Typography

- `--ku-font-family-base` — `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- `--ku-font-family-mono` — `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`
- `--ku-font-size-{xs|sm|md|lg|xl|2xl}` — 12 / 14 / 16 / 20 / 24 / 32 px
- `--ku-font-weight-{regular|medium|semibold|bold}` — 400 / 500 / 600 / 700
- `--ku-line-height-{tight|base|relaxed}` — 1.25 / 1.5 / 1.7

Use Inter everywhere except code (mono). Don't go below 12px.

### Shadows — `--ku-shadow-{1|2|3}`

`1` subtle (resting cards), `2` slight lift, `3` floating. In dark mode shadows
are subtle; rely also on surface-color differentiation (`bg-surface` /
`bg-raised`) and `border` to define edges.

### Z-index — `--ku-z-index-{appbar|sidebar}`

`appbar`=1100, `sidebar`=1000. The scale is intentionally tiny — there are no
overlay components (modals/snackbars/tooltips) in v1, so no overlay z-indices are
defined.

### Breakpoints — `--ku-breakpoint-{sm|md|lg|xl}`

`sm`=600px, `md`=900px, `lg`=1200px, `xl`=1536px. Also exported as TS from
`@koduhai/design-system/theme` for use in JS media-query logic (CSS variables
cannot be used inside `@media` conditions).

### Motion

- `--ku-duration-{fast|base}` — 120ms / 200ms
- `--ku-easing-standard` — `cubic-bezier(0.2, 0, 0, 1)`

Use plain CSS transitions with these tokens. There is no animation library.
`prefers-reduced-motion` is honored in `reset.css`.

---

## Token Source → CSS Generation Pipeline

`scripts/generate-theme-css.ts` reads `tokens.ts` and emits `dist/theme.css`:

- **Scales** (the `tokens` object) become `--ku-<scale>-<key>` declarations under
  `:root` — e.g. `tokens.fontSize.md` → `--ku-font-size-md: 16px;`.
- **Colors** are emitted three times: the **dark** set under `:root` (so dark is
  the default with no attribute), then again under
  `:root[data-theme='dark'], [data-theme="dark"]`, and the **light** set under
  `:root[data-theme='light'], [data-theme="light"]` — e.g.
  `themes.dark.color.bgDefault` → `--ku-color-bg-default: #0A0E1A;`.

The output starts with an auto-generated "do not edit by hand" banner.

`dist/theme.css` is **gitignored and generated**. It must be built before
Storybook or a package build runs, which is wired via npm hooks:

```bash
npm run build:tokens   # tsx scripts/generate-theme-css.ts → dist/theme.css
npm run build          # runs build:tokens, then tsup
# prestorybook / prebuild-storybook also run build:tokens automatically
```

The generation logic itself is unit-tested
(`scripts/generate-theme-css.test.ts`), so the naming convention can't silently
drift.

### Consuming the generated CSS

Consumers import the two stylesheets once:

```tsx
import '@koduhai/design-system/theme.css'; // --ku-* variables
import '@koduhai/design-system/styles.css'; // compiled component styles
```

Components reference the variables directly in their CSS Modules — e.g.
`background-color: var(--ku-color-primary);` — so switching themes is free at
runtime: no re-render of styles, no JS recomputation.

---

## Theming Model (dark-first)

Themes are two sets of CSS-variable values keyed by `[data-theme]`. Switching
themes changes **one attribute** on the root element.

### `KoduhThemeProvider`

```tsx
import { KoduhThemeProvider } from '@koduhai/design-system';

<KoduhThemeProvider defaultMode="dark">{/* app */}</KoduhThemeProvider>;
```

| Prop                 | Type                | Default              | Purpose                                 |
| -------------------- | ------------------- | -------------------- | --------------------------------------- |
| `defaultMode`        | `'dark' \| 'light'` | `'dark'`             | Initial mode when nothing is persisted  |
| `storageKey`         | `string`            | `'koduh-color-mode'` | localStorage key for the persisted mode |
| `disablePersistence` | `boolean`           | `false`              | Disable reading/writing localStorage    |

On mount the provider reads `localStorage` (falling back to `defaultMode`), then
sets `data-theme` on `document.documentElement`. It also imports `reset.css` — the
`CssBaseline` equivalent (box-sizing, margin reset, font inheritance,
`:focus-visible` defaults, `prefers-reduced-motion` handling).

### `useColorMode()`

```tsx
import { useColorMode } from '@koduhai/design-system';

const { mode, setMode, toggleMode } = useColorMode();
```

Returns `{ mode, setMode, toggleMode }`. Must be called within a
`KoduhThemeProvider` (it throws otherwise). `setMode`/`toggleMode` update state and
persist to `localStorage` unless `disablePersistence` is set.

---

## Accessibility: Contrast

Color tokens for **both** themes must independently meet **WCAG AA**:

- **4.5:1** for normal text,
- **3:1** for large text and UI component boundaries.

This is verified at the component level by axe-core e2e tests, which run against
every Storybook story in **both** dark and light themes (zero violations to
merge). Color is never the sole signal in any component.

---

## SSR / Static Hosting: Avoiding a Theme Flash

`KoduhThemeProvider` applies `data-theme` inside a `useEffect`, which only runs
after React mounts on the client. For a **pure client-side SPA** (plain Vite/CRA)
this is fine — nothing paints before React runs.

For **server-rendered or statically pre-rendered** pages, the initial HTML paints
before the effect runs, so a visitor whose persisted mode differs from the
markup's default can see one frame of the wrong theme ("flash of wrong theme").
The fix is a tiny blocking inline `<script>` in the document `<head>` that sets
`data-theme` before first paint, using the **same** defaults as the provider
(localStorage key `koduh-color-mode`, fallback `'dark'`,
`document.documentElement`):

```html
<script>
  (function () {
    try {
      var mode = localStorage.getItem('koduh-color-mode');
      if (mode !== 'dark' && mode !== 'light') mode = 'dark';
      document.documentElement.setAttribute('data-theme', mode);
    } catch (e) {}
  })();
</script>
```

Next.js users can add this via `next/script` with `strategy="beforeInteractive"`,
or inline it in the `<head>` of a custom `_document` / root layout.

---

## Reference: `tokens.ts` (shape)

```ts
export const tokens = {
  space: { 1: '4px', 2: '8px' /* … */, 12: '48px' },
  radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
  fontFamily: { base: "'Inter', system-ui, …", mono: "'JetBrains Mono', …" },
  fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '20px', xl: '24px', '2xl': '32px' },
  fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { tight: '1.25', base: '1.5', relaxed: '1.7' },
  shadow: { 1: '0 1px 2px rgba(0,0,0,0.4)' /* … */ },
  zIndex: { appbar: '1100', sidebar: '1000' },
  breakpoint: { sm: '600px', md: '900px', lg: '1200px', xl: '1536px' },
  duration: { fast: '120ms', base: '200ms' },
  easing: { standard: 'cubic-bezier(0.2, 0, 0, 1)' },
} as const;

export const themes = {
  dark: { color: { primary: '#5B9DFF', bgDefault: '#0A0E1A' /* … */ } },
  light: { color: { primary: '#1B5FCC', bgDefault: '#FFFFFF' /* … */ } },
} as const;
```

---

_This is a living document. Update it as the theme evolves — by editing
`tokens.ts`, never the generated CSS._
