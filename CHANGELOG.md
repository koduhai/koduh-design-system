# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-05-24

Large additive release working the full open-issue backlog in one batch: two
dogfooding bug fixes plus 18 new components, density modes, and DataTable
scaling features (issues #27/#28/#29/#30/#31/#32/#34/#35). No breaking changes.

### Fixed

- **Overlay placement (#34):** `Popover`/`Menu`/`Select`/`Tooltip` `bottom-*`/`top-*`
  placements rendered at the viewport top-left in anchor-positioning browsers — the
  #21 migration left `position-area` mixing physical (`bottom`/`top`) and logical
  (`span-inline-*`) keywords, voiding the declaration. All `position-area` keywords
  are now logical (`block-end`/`inline-start`/`span-block-*`), which both fixes the
  placement and makes `left-*`/`right-*` mirror under `dir="rtl"`. Added an e2e guard
  that an open overlay anchors to its trigger.
- **`ToggleGroup` × `FormField` (#35):** `ToggleGroup` now actually composes with
  `FormField` — it reads `useOptionalFieldContext()` and wires `aria-labelledby`
  (to the field's label), `aria-describedby`, `aria-invalid`, and `aria-required`
  (explicit `aria-label`/`aria-labelledby` still win). `FormField` now exposes a label
  id for group controls that can't use `htmlFor`.

### Added

- **Date input (#27):** `Calendar` (month grid, full keyboard nav, `min`/`max`,
  `Intl`-formatted) and `DatePicker` (input + popover calendar, `FormField`-composing).
- **Data-viz (#28):** `Sparkline` (line/area/bar) and a minimal `Chart` (line/bar),
  plus a categorical chart palette in tokens (`--ku-color-chart-1`…`-8`, per-theme).
- **P2 components (#32):** `Kbd`, `AspectRatio`, `Code`/`CodeBlock`, `Collapsible`,
  `ScrollArea`, `Rating`, `Stepper`, `Timeline`, `HoverCard`, `PinInput`, `FileUpload`,
  `Tree`, `Carousel`, `CommandPalette` — each axe-clean in both themes with keyboard a11y.
- **Density modes (#29):** a `comfortable` (default) / `compact` mechanism via
  `--ku-density-*` tokens and a `data-density` attribute, with a `density` prop on
  `Table`, `TextField`, `Select`, and `Menu`. Exported `density` map + `Density` type.
- **Tabs/Accordion `lazy` + `keepMounted` (#31):** opt-in deferred/persistent panel
  content (default eager, back-compatible). Plus a shared focus-ring utility
  (`.ku-focus-ring`) and `--ku-focus-ring-width`/`-offset` tokens.
- **DataTable at scale, round 2 (#30):** opt-in **row expansion** (`renderExpanded` +
  controllable expanded state), **column resize** (keyboard + pointer, controllable
  widths), and a **server-side data hook** (`manual` + `onStateChange`). Exported
  `ColumnWidths` and `DataTableState`. (Virtualization remains deferred — see follow-up.)

## [2.4.0] - 2026-05-24

Additive release closing four P1 component gaps from the consumer-app gap analysis
(issue #12). No breaking changes.

### Added

- **`AvatarGroup`** (#12) — stacked, overlapping avatars with a `+N` overflow chip.
  `max` caps the visible count; `total` overrides the overflow count for
  server-truncated lists; `size`/`shape` propagate to every child and the chip;
  `spacing` (`'tight' | 'normal'`) tunes the overlap. Built on `Avatar`; overlap uses
  logical margins so it mirrors under `dir="rtl"`.
- **`Stat`** (#12) — dashboard metric block (`label`, `value`, optional `delta`,
  `trend`, `icon`, `helpText`). `trend` (`'up' | 'down' | 'neutral'`) drives the delta
  colour **and** a direction arrow plus visually-hidden direction text, so the change
  is never signalled by colour alone; the value renders with tabular numerals. Ships
  without card chrome so it composes into `Card`.
- **`ToggleGroup`** (#12) — segmented single/multi-select control driven by an `items`
  array. `type="single"` is a `radiogroup` of `radio`s; `type="multiple"` is a `group`
  of `aria-pressed` toggle buttons. Roving focus (arrow keys / Home / End, skipping
  disabled items), shared tone vocabulary (`primary | neutral | success | warning |
  danger`), `size`, and `orientation`. Composes with `FormField`.
- **`Drawer`** (#12) — edge slide-in panel built on the native `<dialog>` +
  `showModal()` machinery (reusing `Dialog`'s focus-trap, backdrop, and Esc handling),
  with the same `open` / `onOpenChange` overlay API. `side` is logical
  (`'start' | 'end' | 'top' | 'bottom'`, default `'end'`) so it flips correctly under
  `dir="rtl"`; `size`, `dismissable`, `initialFocus`, and `footer` mirror `Dialog`. The
  slide-in honours `prefers-reduced-motion`.

All four export their public prop types from `src/index.ts`, ship axe-clean Storybook
stories in both themes, and carry Vitest behaviour tests.

## [2.3.0] - 2026-05-24

Additive release closing the consumer-app responsiveness, RTL, and DataTable-at-scale
follow-ups (issues #20/#21/#22). No breaking changes.

### Added

- **`DataTable` `noResults`** slot and a **function form of `empty`** (#20). `empty`
  now accepts `(ctx: EmptyStateContext) => ReactNode` where `ctx` distinguishes a
  genuinely empty dataset (`hasData: false`) from a filter/search miss
  (`isFiltered: true`); `noResults` is a convenience slot for the miss case and
  takes precedence over `empty` there. `EmptyStateContext` is exported.
- **`Sidebar` `collapseBelow`** (#22) — opt-in `matchMedia`-driven auto-collapse to
  the icon rail at/below a viewport width (number → px, or any media width). The
  toggle still expands; resizing back below the breakpoint re-collapses.

### Changed

- **`DataTable` wraps its table in a horizontal-scroll region** (#22). Wide tables
  (many columns on a narrow viewport) now scroll internally instead of pushing the
  page width out. Note: this establishes a scroll container, so a `stickyHeader`
  needs the wrapper height bounded to stick within it.
- **`DataTable` `loadingRows` now defaults to the effective `pageSize`** (was 5), so
  the loading skeleton height matches the loaded page.
- **`DataTable` filter/search/sort and pagination are now memoized separately** (#20)
  — a page change re-slices the cached sorted set instead of re-running the
  O(n log n) pass over every row. Pipeline split into `filterSortRows` +
  `paginateRows`.
- **RTL: physical CSS migrated to logical properties** (#21) across `Sidebar`,
  `Popover` (+ `Menu`/`Select`/`Tooltip`), `Toaster`, `Select`, `Combobox`,
  `Slider`, `Tabs`, `Accordion`, `Menu`, and `Breadcrumbs`. Borders, padding,
  insets, `text-align`, and `position-area` span keywords now mirror under
  `dir="rtl"`; the `Popover` JS fallback and `Slider` pointer/arrow-key handling
  read direction at runtime. LTR rendering is unchanged.

### Docs

- `DataTable`: documented that `columns` should be stable/memoized for large data,
  and that pagination — not virtualization — is the scaling strategy.

## [2.2.0] - 2026-05-24

Additive release closing the v2.1.0 dogfooding follow-ups (issues #17/#18/#19).
No breaking changes.

### Added

- **`FormField` composes with the shipped controls** (#17). `TextField`,
  `Textarea`, `Select`, `NumberField`, `Combobox`, and `TagInput` detect an
  ancestor `<FormField>` (via the new exported `useOptionalFieldContext()`) and
  defer their label / required `*` / `aria-*` to it — one correctly-associated
  label, correct `htmlFor`. Standalone usage is unchanged.
- **`Combobox` `clearable`** (+ `clearLabel`); `Combobox`/`TagInput`/`Slider` now
  extend their focusable element's HTML attributes, so `onBlur`/`onFocus`/`name`/
  `data-*` reach it.
- **`Slider`** gains `error`/`helperText`/`errorText`.
- **Toast** (#18): `toast.promise(p, { loading, success, error })`; caller-supplied
  stable `id` on `ToastOptions` (re-using an id updates the toast in place);
  per-toast `placement` + support for multiple `<Toaster>`s.
- **Responsive layout props** (#19) on `Grid`/`Stack`/`Inline`:
  `columns={{ base: 1, md: 2 }}`, `gap={{ base: 3, md: 5 }}`, and `Grid`
  `columns={[1.1, 1]}` track ratios — zero-runtime via a per-breakpoint
  CSS-custom-property cascade.
- **`Text`/`Heading` `leading`**; **`Text`** `family`/`numeric`/`transform`/
  `truncate`/`lineClamp`; **`Stack`/`Inline`** `align="baseline"` + `as`;
  **`Container`** `py`.
- **`Box`** — curated layout escape hatch (`padding`/`px`/`py`/`grow`/`shrink`/
  `minWidth`/`width`/`as`/`asChild`). **`DescriptionList`** — `<dl>` key-value
  primitive. (47 components total.)

### Changed

- `Slider.onChange` → `(value, event?)` and `TagInput.onChange` → `(tags, event?)`
  (additive second arg; existing single-arg consumers unaffected).
- `label` is now optional on `TextField`/`Textarea`/`NumberField` (supply it, or
  wrap the control in a `<FormField>`).

### Notes

- `NumberField.onChange` reports `null` when the field is empty (documented).
- Deferred (tracked in #12): the `useForm` validation-orchestration engine,
  DatePicker, FileUpload, multi-select Combobox.

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
