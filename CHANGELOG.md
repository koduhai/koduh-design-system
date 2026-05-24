# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-05-24

Additive release with three new component layers plus ergonomics/a11y fixes, all
surfaced while dogfooding the published package (issues #9–#15).

### Added

- **Layout & typography primitives** (#13): `Stack`, `Inline` (flex with token
  `gap`/`align`/`justify`/`wrap`), `Grid` (`columns` or `minItemWidth` auto-fit),
  `Container` (max-width + padding), `Text` (`size`/`weight`/`tone`/`as`),
  `Heading` (semantic `level` decoupled from visual `size`), and `Link`
  (`tone`/`underline`/`asChild`).
- **Notification system** (#14): `useToast()` + `<Toaster>` layered over the
  Snackbar visuals. A module-singleton store means `useToast()` works anywhere
  without a provider; `<Toaster>` mounts once and manages a FIFO queue (`max`
  visible), per-severity `aria-live`, and pause-on-hover. `Snackbar` stays the
  controlled primitive.
- **Form layer** (#15): `FormField` (+ headless `useField`) standardizes
  label/required/error wiring for custom controls; new inputs `NumberField`
  (steppers + min/max/step), `Slider` (WAI-ARIA slider), `TagInput` (token input
  rendering `Chip`s), and `Combobox` (searchable single-select).
- **`Dialog` `initialFocus`** (#11): a ref or selector for the element to focus on
  open, overriding the native default (the Close button). `ConfirmDialog` defaults
  initial focus to the confirm button.
- **`Select` `required`** (#11): renders the `*` indicator and sets
  `aria-required`, matching `TextField`/`Textarea`.

### Changed

- **`Chip.label` widened to `ReactNode`** (#9): richer labels (glyph + text). When
  `label` isn't a string and the chip is deletable, pass `deleteLabel`
  (otherwise the delete button's accessible name falls back to `"Remove"`).
- **`PageHeader.breadcrumbs` accepts `BreadcrumbItem[]`** (#10): an array renders a
  single internal `<Breadcrumbs>` (one `nav` landmark). A `ReactNode` is now
  rendered **without** a wrapping `<nav>` so it owns its own landmark — fixing the
  nested duplicate-`nav` a11y issue when passing your own `<Breadcrumbs>`.
- **`Link` defaults to `underline="always"`** (#13): links in body text stay
  distinguishable without relying on color (WCAG link-in-text-block). Use
  `underline="hover"`/`"none"` for standalone links (nav, lists).

### Notes

- **`ConfirmDialog` confirm semantics** (#9): `onConfirm()` fires before
  `onOpenChange(false)`, so side effects wired into `onOpenChange` also run on the
  confirm path — distinguish confirm vs. dismiss via `onConfirm`. (Documented in
  [`MIGRATION.md`](./MIGRATION.md).)
- **Deferred** (tracked in #12): DatePicker/Calendar and FileUpload/Dropzone get
  their own spec; multi-select Combobox and the remaining P2 components are still
  pending.

## [2.0.0] - 2026-05-23

A breaking release that harmonizes cross-component API vocabulary and adds DX
conveniences surfaced while dogfooding the published package (issues #4–#7).

### Breaking

- **Overlay close callback renamed `onClose` → `onOpenChange(open: boolean)`** on
  `Dialog`, `ConfirmDialog`, and `Snackbar`, matching `Popover`/`Select`. It fires
  with `false` when the overlay requests to close. `Alert` is unchanged — it has no
  `open` prop, so it keeps a fire-and-forget `onClose`. (#7)
- **`Snackbar` takes its message as `children`** now, not a `message` prop,
  matching `Dialog`. (#7)

See [`MIGRATION.md`](./MIGRATION.md#migration-guide-v1--v2) for the mechanical upgrade.

### Added

- **Tone vocabulary aligned across tonal components.** `Chip` and `Button` gain
  `success` and `warning` tones, so `Button`/`Chip`/`Progress` now share
  `primary | neutral | success | warning | danger`. (#5)
- **Contrast-tested status foreground tokens**
  `--ku-color-{success,warning,danger,info}-fg`, tuned and unit-tested for WCAG AA
  text contrast against the bg surfaces in both themes (the existing `--ku-color-*`
  status colors are fill colors). (#7)
- **`Select` `clearable` prop** (+ `clearLabel`): shows a clear affordance when a
  value is selected and resets it via `onChange('')`, removing the need for a
  synthetic empty option. (#7)
- **App-nav icons:** `HomeIcon`, `DashboardIcon`, `ListIcon`, `ActivityIcon`,
  `ChartIcon`, `BotIcon`, `SettingsIcon`, `BellIcon`, `PlusIcon`,
  `MoreVerticalIcon`, `LogOutIcon`, plus `ChevronUpIcon`/`ChevronLeftIcon`/
  `ChevronRightIcon` — and a prominent `createIcon` Storybook example. (#4)

### Changed

- The CSS bundle is now also emitted as **`dist/styles.css`** to match the public
  `@koduhai/design-system/styles.css` import specifier (it previously aliased
  `dist/index.css`). (#7)
- **Release/docs drift guard** (`npm run verify:exports`, wired into CI and the
  release workflow): fails the build when the built `dist/index.d.ts` export
  surface diverges from `src/index.ts`, or when CLAUDE.md's component count is
  wrong — so a tag can't be cut missing components, as v1.0.0 was (published
  without `DataTable`). (#6)

## [1.1.0] - 2026-05-23

### Added

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
