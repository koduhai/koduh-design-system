# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-05-23

Additive, backward-compatible expansion: 4 data & forms components (Phase 8),
filling the highest-frequency real-world gaps. Built native-first with no new
Layer 2 infrastructure — every v1 architectural rule intact (zero runtime
dependencies, zero-runtime CSS Modules, tokens-as-CSS-variables, WCAG AA).

### Added

- **`Textarea`** — multiline text input with full `TextField` API parity
  (`label`, `value`/`defaultValue`, `onChange(value, event)`, `helperText`,
  `error`/`errorText`, `size`, `required`, `aria-describedby`/`aria-invalid`
  wiring) plus opt-in `autoResize` with `minRows`/`maxRows` clamping.
- **`Progress`** — linear progress bar (`role="progressbar"`) supporting both
  determinate (`value`/`max`, with optional visible label + percentage) and
  indeterminate modes, across `tone` and `size` variants; the indeterminate
  animation honors `prefers-reduced-motion`. Circular progress stays `Spinner`'s
  job.
- **`Pagination`** — controlled numbered pager with ellipsis windowing
  (`count`/`page`/`onPageChange`/`siblingCount`/`boundaryCount`): `<nav>`
  landmark, `aria-current` on the active page, boundary-aware Previous/Next. The
  page-window math lives in the separately unit-tested `getPaginationRange`
  helper, exported alongside the component.
- **`Table`** — generic, data-driven table (`columns`/`data`/`getRowId`):
  intent-only column sorting (`aria-sort`; consumer owns the comparator),
  controlled row selection (select-all + indeterminate, composing `Checkbox`),
  skeleton loading rows (composing `Skeleton`), an `empty` slot, and an optional
  sticky header.

### Notes

- All four components and their prop types are exported from
  `@koduhai/design-system`, pass axe-core in both themes (zero violations), and
  ship with unit tests, stories, and Linux visual-regression baselines. The
  missing Linux baselines for the Phase 5–7 components were also backfilled, so
  the full catalog now has committed visual baselines.
- No new runtime dependencies; tree-shaking still verified by
  `npm run verify:bundle`.
- `Table` sorting and selection are controlled (intent-emitting): the component
  does not reorder `data`, and select-all operates over the current `data` only.
- Out of scope (by design): table virtualization, built-in data fetching /
  client-side filtering, a compact prev/next-only `Pagination` variant, and a
  circular `Progress`.

## [1.2.0] - 2026-05-22

Additive, backward-compatible expansion: 4 floating-UI components (Phase 7),
built native-first on the Popover API + CSS Anchor Positioning — **no**
`Portal`, `FocusTrap`, or JS positioning engine added to Layer 2. Every v1
architectural rule intact (zero runtime dependencies, zero-runtime CSS Modules,
tokens-as-CSS-variables, WCAG AA).

### Added

- **`Popover`** — generic anchored container and the shared foundation: renders
  its content in the browser top layer via the native Popover API (no portal, no
  clipping) and positions it with CSS Anchor Positioning (`anchor-name` /
  `position-anchor` / `position-area`, `@position-try` for flip). Trigger
  toggle and ARIA are consumer-owned.
- **`Tooltip`** — hover/focus-triggered label (`role="tooltip"`,
  `aria-describedby`), open/close delay, Escape to dismiss; transition honors
  `prefers-reduced-motion`.
- **`Select`** — single-choice listbox form control (`aria-haspopup="listbox"`,
  `role="listbox"`/`option`, `aria-activedescendant`); arrow/Home/End keyboard
  nav, controlled/uncontrolled via `value`/`defaultValue`, `error`/`helperText`,
  and focus restored to the trigger on close.
- **`Menu`** — actions menu (`aria-haspopup="menu"`, `role="menu"`/`menuitem`,
  separators); roving keyboard nav, Escape/outside-click close, focus restored
  to the trigger on close.

### Notes

- All four components and their prop types are exported from
  `@koduhai/design-system`, pass axe-core in both themes (zero violations), and
  ship with unit tests, stories, and visual-regression baselines.
- No new runtime dependencies; tree-shaking still verified by
  `npm run verify:bundle`.
- CSS Anchor Positioning support is uneven in early 2026; where unsupported the
  floating element degrades gracefully to a usable default placement.
- Deferred (documented, not bugs): `Select` type-ahead; `Popover` delegates
  trigger toggle/ARIA to consumers (the correct `haspopup`/`describedby` choice
  is pattern-specific). Multi-select `Select`, `Autocomplete`, and `DataTable`
  remain out of scope.

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

[1.2.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.2.0
[1.1.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.1.0
[1.0.0]: https://github.com/koduhai/koduhai-design-system-v2/releases/tag/v1.0.0
