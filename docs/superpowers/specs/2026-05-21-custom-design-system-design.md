# Requirements: Greenfield Custom Design System (`@koduhai/design-system` v2)

**Status:** Draft for review
**Date:** 2026-05-21
**Author:** Koduh AI
**Supersedes:** The current MUI-wrapper-based `@koduhai/design-system` (v0.x)

---

## 1. Overview & Goals

Rebuild `@koduhai/design-system` as a **fully custom, from-scratch React component library** that does **not** depend on Material UI (MUI) or any third-party component/styling library. The new system owns its markup, styling, behavior, and accessibility end to end.

**Primary goals:**

- **Zero MUI dependency.** No `@mui/material`, `@mui/icons-material`, `@mui/x-*`, or Emotion as runtime dependencies.
- **Zero-runtime styling.** Design tokens compiled to CSS custom properties; component styles in CSS Modules. No runtime style serialization.
- **Own the brand.** Full control over every pixel of the visual design — no fighting MUI defaults or theme augmentation.
- **Small, tree-shakeable bundle.** Minimal-to-zero third-party runtime deps. Each component independently importable.
- **WCAG AA accessibility** preserved as a hard requirement.
- **Familiar tooling, new components.** Keep the proven build/test/docs stack (tsup, Vitest, Playwright + axe-core, Storybook 10) so only the components are new, not the workflow.

**Success criteria:**

- 12 production-ready components shipped with parity-or-better quality vs. the MUI versions they replace.
- All components pass axe-core a11y checks and meet 4.5:1 contrast in both dark and light themes.
- Bundle: no MUI/Emotion in `dependencies`; per-component tree-shaking verified.
- A documented migration guide from the MUI-based API to the new clean-break API.

---

## 2. Non-Goals (YAGNI)

The following are explicitly **out of scope** for the first release:

- **Complex overlay/portal components:** `Dialog`, `ConfirmDialog`, `Snackbar` — removed. These require hand-built portals, focus traps, escape/backdrop handling, and timing logic that carry high accessibility risk when built from scratch.
- **`DataTable`** — removed. Sorting, pagination, and selection logic is a large surface better delivered as a dedicated future effort.
- **Multi-theme / white-label theming.** Only dark (primary) and light (secondary) are required.
- **Density / compact modes.**
- **Non-React framework support** (Vue, Svelte, web components).
- **SSR framework integrations** beyond standard React 18 SSR-safety (`useId`).
- **Animation system / motion library.** Use plain CSS transitions only.
- **Form library / validation framework.** `TextField` is a controlled/uncontrolled input, not a form engine.

Removed components remain available to consumers via the existing MUI-based package until a future release reintroduces them. See §13.

---

## 3. Motivation

Why leave the MUI wrapper model:

- **Bundle weight & runtime cost.** MUI + Emotion add significant runtime styling overhead and bundle size for what is, in our usage, thin wrappers.
- **Brand control.** Theme augmentation and `sx` overrides are a constant tax; we frequently fight MUI defaults rather than express our design directly.
- **Dependency coupling.** Consumers must install and version-match a large peer-dependency tree (`@mui/material`, `@emotion/react`, `@emotion/styled`, etc.). Major MUI upgrades are disruptive.
- **Removing the tough components** (overlays, table) eliminates the only parts where MUI's built-in behavior was hard to replicate — making a from-scratch build genuinely practical.

---

## 4. Architecture & Layers

The system is organized into four layers, each with one clear responsibility and a well-defined interface.

```
┌─────────────────────────────────────────────────────────┐
│ Layer 4 — Provider & Entry                                │
│   KoduhThemeProvider, package exports (".", "./theme")    │
├─────────────────────────────────────────────────────────┤
│ Layer 3 — Components (the 12)                             │
│   Button, TextField, Card, … each: .tsx + .module.css     │
├─────────────────────────────────────────────────────────┤
│ Layer 2 — Primitives & Utilities                          │
│   useId, useControllableState, Slot/asChild, mergeRefs,   │
│   composeEventHandlers, VisuallyHidden, reset.css         │
├─────────────────────────────────────────────────────────┤
│ Layer 1 — Tokens                                          │
│   TS token source → generated CSS custom properties       │
└─────────────────────────────────────────────────────────┘
```

**Layer 1 — Tokens.** A single TypeScript source of truth (palette, typography, spacing, radii, shadows, z-index, breakpoints, motion durations). A build step generates a CSS file declaring these as custom properties under `:root[data-theme="dark"]` and `:root[data-theme="light"]`. Tokens are also exported as typed TS objects for consumers who need values in JS (e.g. inline calculations), but components themselves consume only the CSS variables.

**Layer 2 — Primitives & Utilities.** The small from-scratch infrastructure that replaces what MUI provided implicitly. Because overlay components are out of scope, this layer is intentionally minimal — no `Portal` or `FocusTrap` required. It contains:

- `useId()` — SSR-safe unique IDs (wraps React 18 `useId`, with a stable prefix).
- `useControllableState()` — unify controlled/uncontrolled value handling (used by `TextField`).
- `Slot` / `asChild` — polymorphic rendering so `Button` can render as `<a>`, a router `<Link>`, etc., merging props/refs.
- `mergeRefs()`, `composeEventHandlers()` — ref and handler composition helpers.
- `VisuallyHidden` — accessible-but-hidden text for screen readers.
- `reset.css` — a minimal CSS reset/normalize (the `CssBaseline` equivalent), applied by the provider.

**Layer 3 — Components.** The 12 components (§7). Each component is a focused folder:

```
src/components/Button/
  Button.tsx
  Button.module.css
  Button.test.tsx
  Button.stories.tsx
  index.ts
```

Components consume tokens via CSS variables, compose primitives for behavior, and expose a clean typed prop interface. No component reads another component's internals.

**Layer 4 — Provider & Entry.** `KoduhThemeProvider` sets the `data-theme` attribute on a root element, persists the choice to `localStorage`, exposes a `useColorMode()` hook, and injects the reset. The package entry (`src/index.ts`) re-exports all components, the provider, hooks, and types; `src/theme/index.ts` exports tokens only.

---

## 5. Design Tokens & Theming

**Token categories:**

| Category    | Examples                                                              |
| ----------- | --------------------------------------------------------------------- |
| Color       | `--ku-color-primary`, `--ku-color-bg-default`, `--ku-color-text-*`    |
| Typography  | `--ku-font-family`, `--ku-font-size-*`, `--ku-line-height-*`, weights |
| Spacing     | `--ku-space-1` … `--ku-space-n` (4px base scale)                      |
| Radii       | `--ku-radius-sm/md/lg/full`                                           |
| Shadows     | `--ku-shadow-1/2/3`                                                   |
| Z-index     | `--ku-z-appbar`, `--ku-z-sidebar`                                     |
| Breakpoints | `--ku-bp-sm/md/lg/xl` (also exported as TS for media queries)         |
| Motion      | `--ku-duration-fast/base`, `--ku-easing-standard`                     |

**Theming model (dark-first):**

- Themes are expressed as two sets of CSS variable values keyed by `[data-theme="dark"]` (default) and `[data-theme="light"]`.
- Switching themes = changing one attribute on the root; no re-render of styles, no JS theme object threaded through context for styling.
- `KoduhThemeProvider` props: `defaultMode?: 'dark' | 'light'` (default `'dark'`), optional `storageKey`, optional `disablePersistence`.
- The provider reads `localStorage` on mount (falling back to `defaultMode`), applies `data-theme`, and exposes `{ mode, setMode, toggleMode }` via `useColorMode()`.
- Color tokens for **both** themes must independently meet **WCAG AA 4.5:1** contrast for text and 3:1 for large text / UI components.

**Token source → CSS generation:** A build script reads the TS token definitions and emits `dist/theme.css` (and a dev copy). This keeps a single source of truth while delivering zero-runtime CSS. The generation step is part of `npm run build`.

### 5a. Icons

The new system does **not** depend on `@mui/icons-material`. Instead it ships a **small, vendored in-house SVG icon set** under `src/icons`, sized to cover only what the 12 components and common app usage need (e.g. close, chevron/caret, check, info/success/warning/error, menu/hamburger, search, user).

- Each icon is a standalone React component rendering an inline `<svg>` with `currentColor` fill/stroke, a configurable `size` prop, and `aria-hidden` by default (decorative); consumers add a label when an icon is meaningful.
- Icons are tree-shakeable individual exports, surfaced via the `@koduhai/design-system/icons` entry (§11).
- Every component prop that accepts an icon (`startIcon`, `endIcon`, `Alert` icon, `Avatar`/`Chip` icon, etc.) accepts **any `ReactNode`**, so consumers may pass our icons, their own SVGs, or another icon library — the system never forces our set on them.
- The set is intentionally minimal; it is not a general-purpose icon library and will grow only as concrete needs arise (YAGNI).

---

## 6. Primitives & Accessibility Infrastructure

Detailed requirements for Layer 2:

- **`useId(prefix?)`** — Returns a stable, SSR-safe ID. Used to associate labels, descriptions, and `aria-*` attributes (e.g. `TextField` label/input/helper-text linkage).
- **`useControllableState({ value, defaultValue, onChange })`** — Returns `[state, setState]` that respects a controlled `value` when provided, else manages internal state. Powers `TextField` and `Chip` selection.
- **`Slot` + `asChild` pattern** — When a component receives `asChild`, it merges its props/className/ref onto the single child element instead of rendering its own DOM node. Enables `Button` polymorphism (`<a>`, router `Link`, `mailto:`) without an `as`/`component` prop explosion. Must merge `className`, `style`, event handlers (`composeEventHandlers`), and refs (`mergeRefs`).
- **`VisuallyHidden`** — Renders content available to assistive tech but visually hidden (standard clip pattern). Used for icon-only buttons, status text, etc.
- **`reset.css`** — Box-sizing, margin reset, font inheritance, focus-visible defaults, `prefers-reduced-motion` handling. Applied once by the provider.

This layer has **no portal and no focus-trap** because all overlay components are out of scope (§2). That is the deliberate reason the from-scratch approach is low-risk for v1.

---

## 7. Component Requirements

**Final scope: 12 components.** All are styling + light-state components with no portal/focus-trap needs.

| Component       | Purpose                     | Key props (clean-break API)                                                                                                           | A11y notes                                                                                                |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Button`        | Primary action trigger      | `variant` (`solid`/`outline`/`ghost`), `tone` (`primary`/`neutral`/`danger`), `size`, `asChild`, `startIcon`, `endIcon`, `fullWidth`  | Native `<button>`; `asChild` for links keeps correct role; visible focus ring                             |
| `LoadingButton` | Button with loading state   | All `Button` props + `loading`, `loadingText`                                                                                         | `aria-busy` while loading; disabled interaction; spinner has `aria-hidden`                                |
| `Card`          | Surface container           | `variant` (`outlined`/`elevated`/`flat`), `padding`, `as`                                                                             | Semantic container; heading structure left to consumer                                                    |
| `TextField`     | Single-line text input      | `label`, `value`/`defaultValue`, `onChange`, `helperText`, `error`, `errorText`, `size`, `startAdornment`, `endAdornment`, `required` | Label `htmlFor` linked via `useId`; helper/error via `aria-describedby`; `aria-invalid`                   |
| `AppBar`        | Top navigation bar          | `logo`, `title`, `actions`, `position` (`static`/`sticky`), `elevation`                                                               | `<header>` landmark; nav actions keyboard-reachable                                                       |
| `Sidebar`       | Collapsible nav sidebar     | `items`, `collapsed`, `defaultCollapsed`, `onToggle`, `width`, `header`, `footer`                                                     | `<nav>` landmark; toggle is a labeled `<button>`; current item `aria-current`; pure layout, no focus trap |
| `Alert`         | Inline feedback banner      | `severity` (`info`/`success`/`warning`/`error`), `title`, `closable`, `onClose`, `icon`                                               | `role="alert"` / `role="status"` per severity; close button labeled                                       |
| `Chip`          | Compact label / tag         | `label`, `variant` (`solid`/`outline`), `tone`, `size`, `onClick`, `onDelete`, `icon`                                                 | Clickable chip is a `<button>`; delete affordance labeled                                                 |
| `Avatar`        | User avatar                 | `src`, `alt`, `name` (initials fallback), `size` (`sm`/`md`/`lg`), `shape`                                                            | `alt` required when image; initials get `aria-label`                                                      |
| `EmptyState`    | Placeholder for empty views | `icon`, `title`, `description`, `action`                                                                                              | Heading semantics; action is a real button/link                                                           |
| `PageHeader`    | Page title region           | `title`, `subtitle`, `breadcrumbs`, `actions`                                                                                         | `<h1>`/heading level configurable; breadcrumbs in `<nav aria-label>`                                      |
| `StatusBadge`   | Semantic status indicator   | `status` (`active`/`inactive`/`pending`/`error`), `label`, `variant`                                                                  | Color never the sole signal — text label always present                                                   |

> Exact prop names are finalized during the writing-plans phase; the table sets intent and the clean-break direction (§8).

---

## 8. API Design Principles (Clean-Break)

The new API is designed for clarity, not MUI compatibility:

- **Semantic prop vocabulary.** Prefer `tone` + `variant` over MUI's `color` + `variant` overloading. Use `solid`/`outline`/`ghost` rather than `contained`/`outlined`/`text`.
- **`asChild` over `component`/`as`.** Polymorphism via the `Slot` pattern.
- **Controlled/uncontrolled symmetry.** Every stateful component supports both `value`/`defaultValue` with a single `onChange` contract.
- **No prop passthrough to a hidden vendor component.** Props are explicit and typed; we do not silently forward an unbounded MUI prop set. Standard DOM attributes (`className`, `id`, `data-*`, `aria-*`, `onClick`, etc.) are forwarded to the root element.
- **Every exported prop type is published** (e.g. `ButtonProps`, `TextFieldProps`, `SidebarItem`, `StatusBadgeStatus`).
- **All API differences from the MUI version are documented** in the migration guide (§13).

---

## 9. Accessibility Requirements

- **WCAG 2.1 AA** is a hard, non-negotiable requirement.
- **Contrast:** 4.5:1 for normal text, 3:1 for large text and UI component boundaries — verified in **both** dark and light themes.
- **Keyboard:** every interactive element is reachable and operable by keyboard with a visible `:focus-visible` ring.
- **Semantics:** correct native elements and ARIA roles; landmarks for `AppBar` (`<header>`) and `Sidebar` (`<nav>`).
- **Color is never the only signal** (e.g. `StatusBadge` always shows text).
- **`prefers-reduced-motion`** respected in `reset.css` and all transitions.
- **Automated enforcement:** axe-core runs against every Storybook story in CI; zero violations to merge.

---

## 10. Testing Strategy

Mirror the current proven layers:

| Layer         | Tool                           | Requirement                                                           |
| ------------- | ------------------------------ | --------------------------------------------------------------------- |
| Unit          | Vitest + React Testing Library | Behavior, props, controlled/uncontrolled, event callbacks, edge cases |
| Visual        | Playwright snapshots           | One+ snapshot per story per theme (dark & light) for regression       |
| Accessibility | Playwright + axe-core          | Every story, zero violations, both themes                             |
| Type          | `tsc --noEmit`                 | Strict mode passes; exported types verified                           |

- Each component ships with co-located `*.test.tsx` and `*.stories.tsx`.
- Test count target: meet or exceed current coverage proportionally for the 12 retained components.
- Visual baselines captured for both themes (the current suite is dark-only by story; new suite parametrizes theme).

---

## 11. Build & Packaging

- **Build tool:** tsup → CJS (`.js`) + ESM (`.mjs`) + types (`.d.ts`).
- **Token CSS generation:** a pre-build script emits `dist/theme.css` from the TS token source.
- **Component CSS:** CSS Modules compiled and extracted to a single `dist/styles.css` that consumers import once (`import '@koduhai/design-system/styles.css'`). Class names are hashed/scoped at build time. _(Per-component CSS extraction is a possible future optimization; single-file is the v1 requirement for simplicity.)_
- **Exports:**

  | Import path                         | Contents                              |
  | ----------------------------------- | ------------------------------------- |
  | `@koduhai/design-system`            | Components + provider + hooks + types |
  | `@koduhai/design-system/theme`      | Tokens (TS) only                      |
  | `@koduhai/design-system/icons`      | Vendored SVG icon components          |
  | `@koduhai/design-system/styles.css` | Compiled component styles             |
  | `@koduhai/design-system/theme.css`  | Token CSS variables                   |

- **`sideEffects`:** mark JS as side-effect-free for tree-shaking; CSS files listed as having side effects so bundlers retain them.
- **Peer dependencies:** `react` and `react-dom` (`^18 || ^19`) only. **No MUI, no Emotion.**
- **Publishing:** unchanged — GitHub Packages via GitHub Actions on `v*` tag push, auto-generated changelog and GitHub Release.

**Build risk:** CSS Modules extraction with tsup/esbuild may require a PostCSS or esbuild CSS-modules plugin. Validate the extraction pipeline in Phase 1 before building components. (See §14.)

---

## 12. Documentation (Storybook)

- **Storybook 10** remains the living documentation surface.
- Every component has stories covering each variant/state, in both themes (a global theme toggle/decorator).
- A **Tokens/Foundations** section documents color, typography, spacing, etc.
- `@storybook/addon-a11y` enabled in-canvas.
- The five existing `docs/*.md` guides are updated: overview, component guidelines (rewritten for the from-scratch model), theme specification, icon guidelines, Storybook guide.

---

## 13. Migration Path

Because this is a **clean-break API** and a **major version**, migration is explicit and opt-in:

- Ship as **`@koduhai/design-system` v1.0.0** — a major bump signaling the breaking redesign, published under the **same package name** (no transition alias).
- Provide a **`MIGRATION.md`** with a per-component before/after table (MUI-era prop → new prop) and theme-setup changes (`ThemeProvider`/`darkTheme` → `KoduhThemeProvider` + CSS imports).
- **Removed components** (`Dialog`, `ConfirmDialog`, `DataTable`, `Snackbar`) are documented as "not yet available in v1; remain on the v0.x package until reintroduced." Consumers needing them stay on v0.x for those.
- Codemod is **not** in scope; migration is manual but guided.

---

## 14. Risks & Open Questions

| #   | Risk / Question                                                                 | Mitigation / Resolution                                                                                                    |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | CSS Modules extraction in a tsup/esbuild library build can be fiddly.           | Spike the build pipeline in Phase 1 before any component work; pick PostCSS plugin.                                        |
| 2   | Hand-built focus/keyboard behavior on `Sidebar` could regress a11y.             | Sidebar needs no focus trap; cover with axe + keyboard tests. Low risk.                                                    |
| 3   | Theme switching via `data-theme` must not flash wrong theme on first paint.     | Document an inline `<head>` script snippet for consumers doing SSR/static hosting.                                         |
| 4   | Consumers depending on removed components must stay on v0.x.                    | Clearly documented in MIGRATION.md; v0.x package remains published.                                                        |
| 5   | Open: single `styles.css` vs. per-component CSS for tree-shaking.               | v1 = single file (decided). Revisit if bundle analysis shows it matters.                                                   |
| 6   | Versioning approach.                                                            | **Decided:** ship as `@koduhai/design-system` v1.0.0 under the same package name.                                          |
| 7   | Icons: current system re-exports MUI icons. New system must not depend on them. | **Decided:** vendor a small in-house SVG icon set under `src/icons` (§5a). Icon-accepting props also take any `ReactNode`. |

---

## 15. Phased Delivery Plan

1. **Phase 0 — Foundations & build spike.** Token source + CSS generation, `reset.css`, primitives (Layer 2), the vendored SVG icon set (§5a), and a validated tsup + CSS Modules extraction pipeline proven on one throwaway component. Storybook + theme decorator + axe + Playwright wired up.
2. **Phase 1 — Trivial components.** `Button`, `LoadingButton`, `Chip`, `Avatar`, `StatusBadge`, `Alert`. Establishes patterns end to end (styling, tests, stories, both themes).
3. **Phase 2 — Form & content.** `TextField`, `Card`, `EmptyState`, `PageHeader`.
4. **Phase 3 — Layout.** `AppBar`, `Sidebar`.
5. **Phase 4 — Polish & release.** Migration guide, docs rewrite, bundle/tree-shaking verification, full a11y audit, v1.0.0 release via existing CI.

Each phase is independently shippable behind the same package and leaves the system in a working, tested state.
