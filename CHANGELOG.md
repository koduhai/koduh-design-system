# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.0.0
