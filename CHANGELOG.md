# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Components

- **`DataTable`** — a client-side, stateful wrapper around `Table` adding multi-column
  sort (shift-click), pagination with page-size control, row selection across pages
  (select-all targets all matching rows), global search, and per-column filters
  (text, multi-select enum, number range, date range). Fully controllable
  (uncontrolled by default). `Table` gains an additive `selectAllIds` prop and
  multi-column `sort` rendering.

## [1.0.0] - 2026-05-23

First stable release of the from-scratch, MUI-free design system: **zero runtime
dependencies**, zero-runtime CSS Modules, design tokens compiled to CSS custom
properties (`--ku-*`), and WCAG 2.1 AA enforced across every component.

### Foundations

- Design tokens → CSS custom properties, `reset.css`, `KoduhThemeProvider` +
  `useColorMode`, a vendored SVG icon set (`createIcon`), and the primitives that
  replace MUI's implicit infra: `Slot`/`asChild`, `mergeRefs`,
  `composeEventHandlers`, `useId`, `useControllableState`, `VisuallyHidden`, `cx`.

### Components

- **Actions:** `Button`, `LoadingButton`.
- **Form controls:** `TextField`, `Textarea` (with `autoResize`), `Checkbox`
  (with `indeterminate`), `Radio` + `RadioGroup`, `Switch`, `Select`.
- **Data display & feedback:** `Chip`, `Avatar`, `StatusBadge`, `Alert`, `Card`,
  `EmptyState`, `Divider`, `Skeleton`, `Spinner`, `Progress`, `Table`.
- **Navigation & layout:** `PageHeader`, `AppBar`, `Sidebar`, `Breadcrumbs`,
  `Tabs`, `Accordion`, `Menu`, `Pagination`.
- **Overlays & floating:** `Dialog` + `ConfirmDialog` (native `<dialog>`),
  `Snackbar`, `Popover`, `Tooltip` (Popover API + CSS Anchor Positioning, no
  `Portal`/`FocusTrap` added).

### API conventions

- **Consistent vocabulary:** `variant` + `tone` (not MUI's overloaded `color`);
  `solid`/`outline`/`ghost`; the `outline` variant is spelled `outline`
  everywhere (Button, Chip, Card).
- **Controlled/uncontrolled symmetry:** every stateful component supports
  `value`/`defaultValue` (or `checked`/`open`/`collapsed` + their `default*`)
  with a single change callback — `onChange(value, event)` for value inputs,
  `on<Thing>Change` for named state (`onOpenChange`, `onCollapsedChange`,
  `onPageChange`, `onSortChange`, `onSelectionChange`).
- **Dismissal** is named `dismissable` consistently (`Alert`, `Dialog`,
  `Popover`).
- **Form fields** share one contract: `label`, `error`, `helperText`,
  `errorText` (`TextField`, `Textarea`, `Select`); form-control `label`s accept
  `ReactNode`.
- **DOM passthrough:** components extend the matching `HTMLAttributes`, forwarding
  `className`, `style`, `data-*`, `aria-*`, `id`, and handlers to the root via
  `forwardRef`. `asChild` (via `Slot`) provides polymorphism instead of `as`.
- Every public prop type is exported; `HeadingLevel` is a single shared type.

### Quality

- axe-core a11y tests on every component in **both** themes (zero violations),
  Vitest behavior tests, strict `tsc`, and Playwright visual-regression baselines.
- CJS + ESM + `.d.ts` builds via tsup; tree-shaking verified by
  `npm run verify:bundle` (`/* @__PURE__ */`-annotated factories).
- No runtime dependencies; React 18/19 are peer dependencies.

### Migrating from the v0.x MUI wrapper

See `MIGRATION.md` for the full prop-by-prop mapping.

[1.0.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.0.0
