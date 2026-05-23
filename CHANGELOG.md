# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-22

Additive, backward-compatible expansion: 12 new components across two phases,
keeping every v1 architectural rule intact (zero runtime dependencies,
zero-runtime CSS Modules, tokens-as-CSS-variables, WCAG AA).

### Added

- **Form controls:** `Checkbox` (with `indeterminate`), `Radio` + `RadioGroup`,
  and `Switch` (`role="switch"`) — native inputs with controlled/uncontrolled
  symmetry and labels linked via `useId`.
- **Presentational:** `Spinner` (`role="status"`), `Skeleton`
  (text/rect/circle, shimmer honors `prefers-reduced-motion`), and `Divider`
  (`role="separator"`, optional label).
- **Disclosure & navigation:** `Accordion` (`aria-expanded`/`aria-controls`),
  `Breadcrumbs` (`<nav aria-label="Breadcrumb">`, `aria-current="page"`), and
  `Tabs` (roving tabindex, arrow-key + Home/End nav).
- **Overlays (native-first, no `Portal`/`FocusTrap` added):** `Dialog` and
  `ConfirmDialog` via the native `<dialog>` element (`showModal()` provides
  focus trap, Escape, inert background, `::backdrop`), and `Snackbar` via the
  Popover API (top-layer, non-modal, auto-hide pauses on hover/focus).

### Notes

- All new components and prop types are exported from `@koduhai/design-system`,
  pass axe-core in both themes (zero violations), and ship with unit tests,
  stories, and visual-regression baselines.
- No new runtime dependencies; tree-shaking still verified by
  `npm run verify:bundle`.
- No refactor of v1.0 components: `LoadingButton` keeps its internal spinner and
  `PageHeader` keeps its inline breadcrumbs — the new components are additive.

## [1.0.0] - 2026-05-22

First stable release of the from-scratch, MUI-free design system.

### Added

- **Foundations:** design tokens compiled to CSS custom properties (`--ku-*`),
  `reset.css`, `KoduhThemeProvider` + `useColorMode`, a vendored SVG icon set
  (`createIcon`), and primitives (`Slot`/`asChild`, `mergeRefs`,
  `composeEventHandlers`, `useId`, `useControllableState`, `VisuallyHidden`).
- **12 components:** `Button`, `LoadingButton`, `Chip`, `Avatar`, `StatusBadge`,
  `Alert`, `TextField`, `Card`, `EmptyState`, `PageHeader`, `AppBar`, `Sidebar`.
- Zero-runtime CSS Modules styling; CJS + ESM + `.d.ts` builds via tsup.
- Tree-shaking: `/* @__PURE__ */`-annotated component and icon factories let
  bundlers drop unused exports (verified by `npm run verify:bundle`).
- WCAG 2.1 AA: axe-core a11y tests on every component in both themes (zero
  violations) and visual-regression baselines enforced in CI.

### Notes

- No runtime dependencies; React 18/19 are peer dependencies.
- Clean break from the v0.x MUI wrapper — see `MIGRATION.md`.

[1.1.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.1.0
[1.0.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.0.0
