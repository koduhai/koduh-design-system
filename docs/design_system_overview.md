# Design System Overview

> **Document Owner:** Founder
> **Last Updated:** May 22, 2026
> **Status:** Living Document (system mid-build — see Current Status)

---

## What Is the Koduh AI Design System?

The Koduh AI design system is a **fully custom, from-scratch React component
library** — packaged as a single versioned NPM library
(`@koduhai/design-system`). It owns its markup, styling, behavior, and
accessibility end to end, and ensures a consistent look and feel across all
Koduh AI products (internal tools, client projects, and company properties).

This is **v1**, a clean-break rebuild that **supersedes** the old
MUI-wrapper-based v0.x. The new system does **not** depend on Material UI (MUI),
Emotion, or any third-party component or styling library. The only runtime
peer dependencies are `react` and `react-dom`.

---

## Core Philosophy

| Principle                            | What It Means                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Zero MUI dependency**              | No `@mui/material`, `@mui/icons-material`, `@mui/x-*`, or Emotion. We own every pixel — no fighting MUI defaults or augmentation. |
| **Zero-runtime styling**             | Design tokens compile to CSS custom properties; component styles are CSS Modules. No `sx`, no runtime style serialization.        |
| **Own the brand**                    | Full control over the visual design. Styling is expressed directly in CSS, not through a theme object threaded via React context. |
| **Small & tree-shakeable**           | Minimal-to-zero third-party runtime deps. Each component is independently importable.                                             |
| **WCAG AA, always**                  | Accessibility is a hard, non-negotiable requirement, verified in both dark and light themes.                                      |
| **Dark mode first**                  | Dark is the primary theme. Light is the secondary option. No multi-theme / white-label support.                                   |
| **Familiar tooling, new components** | We kept the proven build/test/docs stack (tsup, Vitest, Playwright + axe-core, Storybook 10). Only the components are new.        |

### Why we left the MUI wrapper model

- **Bundle weight & runtime cost.** MUI + Emotion added significant runtime
  styling overhead and bundle size for what were, in our usage, thin wrappers.
- **Brand control.** Theme augmentation and `sx` overrides were a constant tax.
- **Dependency coupling.** Consumers had to install and version-match a large
  peer-dependency tree; major MUI upgrades were disruptive.
- **Dropping the hard components** (overlays, data table — see Non-Goals) removed
  the only parts where MUI's built-in behavior was hard to replicate, making a
  from-scratch build genuinely practical and low-risk.

---

## Architecture

The system is organized into four layers, low → high. Each layer depends only on
the layers below it, and no component reads another component's internals.

```
┌─────────────────────────────────────────────────────────┐
│ Layer 4 — Provider & Entry                                │
│   KoduhThemeProvider, useColorMode, package exports       │
├─────────────────────────────────────────────────────────┤
│ Layer 3 — Components (the 12)                             │
│   Button, TextField, Card, … each: .tsx + .module.css     │
├─────────────────────────────────────────────────────────┤
│ Layer 2 — Primitives & Utilities                          │
│   Slot/asChild, useId, useControllableState, mergeRefs,   │
│   composeEventHandlers, VisuallyHidden, cx, reset.css      │
├─────────────────────────────────────────────────────────┤
│ Layer 1 — Tokens                                          │
│   TS token source → generated CSS custom properties (--ku-*)│
└─────────────────────────────────────────────────────────┘
```

**Layer 1 — Tokens** (`src/theme/tokens.ts`). A single TypeScript source of truth
for color, typography, spacing, radii, shadows, z-index, breakpoints, and motion.
A build step (`scripts/generate-theme-css.ts`) emits a CSS file declaring these as
`--ku-*` custom properties. Tokens are also exported as typed TS objects for
consumers who need values in JS, but components themselves consume **only** the
CSS variables. See [Theme Specification](theme_specification.md).

**Layer 2 — Primitives & Utilities** (`src/primitives`, `src/utils`,
`src/styles/reset.css`). The small from-scratch infrastructure that replaces what
MUI provided implicitly: `Slot`/`asChild`, `mergeRefs`, `composeEventHandlers`,
`useId`, `useControllableState`, `VisuallyHidden`, the `cx` class-name helper, and
a `reset.css` (the `CssBaseline` equivalent). There is intentionally **no Portal
and no FocusTrap** — overlay components are out of scope, which is the deliberate
reason the from-scratch approach is low-risk.

**Layer 3 — Components** (`src/components/<Name>/`). Each component is a
self-contained folder (`Name.tsx`, `Name.module.css`, `Name.test.tsx`,
`Name.stories.tsx`, `index.ts`). Components consume tokens via CSS variables,
compose primitives for behavior, and expose a clean typed prop interface. See
[Component Guidelines](component_guidelines.md).

**Layer 4 — Provider & Entry** (`src/provider`, `src/index.ts`, `src/icons`).
`KoduhThemeProvider` sets `data-theme` on `<html>`, persists the choice to
`localStorage`, exposes a `useColorMode()` hook, and imports the reset.
`src/index.ts` re-exports all components, the provider, hooks, primitives, and
types.

---

## Package Entry Points

Everything ships as one package, `@koduhai/design-system`, published on GitHub
Packages. It exposes several entry points:

| Import path                         | Contents                                           |
| ----------------------------------- | -------------------------------------------------- |
| `@koduhai/design-system`            | Components + provider + hooks + primitives + types |
| `@koduhai/design-system/theme`      | Design tokens as typed TS objects (no components)  |
| `@koduhai/design-system/icons`      | Vendored in-house SVG icon components              |
| `@koduhai/design-system/styles.css` | Compiled component styles (import once)            |
| `@koduhai/design-system/theme.css`  | Token CSS custom properties (`--ku-*`)             |

`sideEffects` in `package.json` lists only the CSS files, so JS tree-shakes while
bundlers retain the styles.

---

## How to Consume

### Install

```bash
npm install @koduhai/design-system
```

> The package is hosted on GitHub Packages. Configure `.npmrc` to authenticate
> with the `@koduhai` scope.

### Wrap your app

There is **no** MUI `ThemeProvider` / `createTheme` / `CssBaseline`. Instead,
import the two stylesheets once and wrap the app in `KoduhThemeProvider`:

```tsx
import { KoduhThemeProvider } from '@koduhai/design-system';
import '@koduhai/design-system/theme.css'; // --ku-* CSS variables
import '@koduhai/design-system/styles.css'; // compiled component styles

function App() {
  return <KoduhThemeProvider defaultMode="dark">{/* Your app */}</KoduhThemeProvider>;
}
```

The provider applies the `data-theme` attribute, persists the mode to
`localStorage`, and injects the reset (the `CssBaseline` equivalent).

### Use components and icons

```tsx
import { Button } from '@koduhai/design-system';
import { SearchIcon } from '@koduhai/design-system/icons';

<Button variant="solid" tone="primary" startIcon={<SearchIcon />}>
  Search
</Button>;
```

Note that icons are imported from the dedicated `./icons` entry, and any
icon-accepting prop (`startIcon`, `endIcon`, etc.) takes **any `ReactNode`** —
the system never forces our icon set on consumers. See
[Icon Guidelines](icon_guidelines.md).

### Reading or controlling the theme

```tsx
import { useColorMode } from '@koduhai/design-system';

function ThemeToggle() {
  const { mode, toggleMode } = useColorMode();
  return <Button onClick={toggleMode}>Switch to {mode === 'dark' ? 'light' : 'dark'}</Button>;
}
```

---

## Current Status

The system is **mid-build**, delivered in phases (§15 of the spec):

| Phase                           | Scope                                                                                                                                                            | Status   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Phase 0 — Foundations**       | Token source + CSS generation, `reset.css`, primitives, vendored icon set, validated tsup + CSS Modules pipeline, Storybook + theme decorator + axe + Playwright | **Done** |
| **Phase 1 — Simple components** | `Button`, `LoadingButton`, `Chip`, `Avatar`, `StatusBadge`, `Alert`                                                                                              | **Done** |
| **Phase 2 — Form & content**    | `TextField`, `Card`, `EmptyState`, `PageHeader`                                                                                                                  | Planned  |
| **Phase 3 — Layout**            | `AppBar`, `Sidebar`                                                                                                                                              | Planned  |
| **Phase 4 — Polish & release**  | Migration guide, docs, bundle/tree-shaking verification, full a11y audit, v1.0.0 release                                                                         | Planned  |

The full **12-component plan** is in the spec (§7). Components are exported from
`src/index.ts` as they land. Documentation describes the **current** state — it
does not document planned components as if they exist.

> **Removed components.** `Dialog`, `ConfirmDialog`, `Snackbar`, and `DataTable`
> are intentionally out of scope for v1 (they require hand-built portals, focus
> traps, and timing logic with high a11y risk). Consumers who need them stay on
> the v0.x MUI-based package until a future release reintroduces them.

---

## Technology

| Choice            | Details                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| **Base Library**  | None — fully custom (no MUI, no Emotion)                               |
| **Styling**       | Design tokens → CSS custom properties; component styles in CSS Modules |
| **Language**      | TypeScript (strict mode)                                               |
| **Build Tool**    | tsup → CJS (`.js`) + ESM (`.mjs`) + types (`.d.ts`)                    |
| **Documentation** | Storybook 10 (`@storybook/react-vite`)                                 |
| **Testing**       | Vitest + React Testing Library; Playwright + axe-core for a11y/visual  |
| **Linting**       | ESLint + Prettier                                                      |
| **Publishing**    | GitHub Packages via GitHub Actions on `v*` tag                         |

---

## Related Documents

| Document                                        | Description                                   |
| ----------------------------------------------- | --------------------------------------------- |
| [Component Guidelines](component_guidelines.md) | How components are built and consumed         |
| [Theme Specification](theme_specification.md)   | Tokens, `--ku-*` generation, theming model    |
| [Icon Guidelines](icon_guidelines.md)           | The vendored SVG set and `createIcon` factory |
| [Storybook Guide](storybook_guide.md)           | Writing stories, the theme toolbar, a11y      |

The authoritative spec is
[`docs/superpowers/specs/2026-05-21-custom-design-system-design.md`](superpowers/specs/2026-05-21-custom-design-system-design.md).

---

_This is a living document. Update it as the design system evolves._
