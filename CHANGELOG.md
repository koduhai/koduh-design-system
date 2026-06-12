# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.11.0] - 2026-06-12

Additive feature release: `Select` multi-select, a full i18n string sweep, a
date/time input layer (`TimePicker`, `Calendar` range mode, `DateRangePicker`,
`DatePicker` date+time), and opt-in `DataTable` row virtualization. No breaking
changes; default output and existing behavior are unchanged. Component count 79
→ 81.

### Added

- **`Select` multi-select** (#81): a `multiple` mode mirroring Combobox —
  discriminated-union props (single → `string`, multi → `string[]`), selected
  values render as removable chips, clicking an option toggles it and keeps the
  listbox open, the listbox is `aria-multiselectable`, and Backspace on the
  trigger removes the last chip. Single-select behavior is unchanged.
- **Date/time layer** (#42 + #61):
  - **`TimePicker`** — a from-scratch segmented control (a `role="group"` of
    `role="spinbutton"` hour/minute(/second) segments): 24h or 12h with a
    localized AM/PM segment, optional seconds, full keyboard (arrow step with
    `minuteStep`, segment navigation, digit entry with auto-advance, Backspace
    clear), and FormField composition.
  - **`Calendar` range mode** — a discriminated-union `mode` (`'single'`
    default); range mode picks a start then an end with an in-range band, pointer
    hover preview, and keyboard selection.
  - **`DateRangePicker`** — two date fields + a calendar trigger over the range
    Calendar.
  - **`DatePicker` date+time** — `granularity='minute'` adds a `TimePicker` to the
    popover; `value`/`onChange` then carry the full date + time and `min`/`max`
    are honored at minute resolution (also serves as the date-time picker).
- **`DataTable` row virtualization** (#37): opt-in `virtualized` windows the full
  sorted/filtered result inside a fixed-height scroll viewport (only the visible
  rows mount, between spacer rows), as an alternative to pagination. Coexists
  with sort, filter/search, selection, sticky header, and column resize.
  `aria-rowcount`/`aria-rowindex` convey the true count to assistive tech.
  Configurable `rowHeight` / `viewportHeight` / `overscan`. (Not combined with
  `renderExpanded` or `manual` mode — those render the paginated path.)
- **i18n: full string sweep** (#79): extended the central `Messages` catalog and
  migrated every remaining hardcoded user-facing string onto `useMessages()`
  (FileUpload, PasswordInput, ColorPicker, PinInput, Rating, Stepper, Banner,
  Calendar, Breadcrumbs, Chip, Sidebar, Carousel, CommandPalette, DatePicker,
  DataTable + ColumnFilter, NumberField, Table, Toaster, Code, Chart). Defaults
  are byte-identical, so default output is unchanged.

### Changed

- `Chip.onDelete` now forwards its click event (non-breaking: a `() => void`
  handler still fits), so chip removal reports a real event.
- `Banner` gained a `closeLabel` prop (overrides the i18n `dismiss` default).
- New exported types: `SelectSingleProps` / `SelectMultiProps`,
  `TimePickerProps` / `TimePickerSize`, `DateRangePickerProps` /
  `DateRangePickerSize`, `CalendarSingleProps` / `CalendarRangeProps` /
  `DateRange`, and `DatePicker`'s `granularity` / `hourCycle` / `withSeconds` /
  `minuteStep` props.

## [2.10.0] - 2026-06-11

Additive feature release: a shared live-region announcer primitive, a central
i18n layer for all built-in UI strings, and a substantially expanded `Combobox`
(multi-select, async/loading, create-option). No breaking changes; default
output and behavior are unchanged out of the box.

### Added

- **Live-region announcer** (#40): `<LiveRegion politeness atomic>` for
  declarative, state-driven announcements (a visually-hidden `role=status`/`alert`
  region rendering the current message as children), plus `useAnnouncer()` /
  `announce(message, politeness)` for imperative, fire-and-forget announcements
  via a lazily-created, SSR-safe shared region (one element per politeness level).
  The ad-hoc invisible regions in `Carousel` and `TagInput` migrate onto
  `<LiveRegion>`, and `Combobox` now announces its live result count as the list
  filters.
- **Central i18n layer** (#41): `KoduhI18nProvider` (`messages` + `locale`),
  `useMessages()`, `useLocale()`, and a typed `Messages` catalog with English
  `defaultMessages`. With no provider, components fall back to English defaults
  (behavior unchanged); per-component string props still win over the provider.
  The built-in strings of `Pagination`, `Dialog`, `Drawer`, `AvatarGroup`,
  `Combobox`, `Carousel`, `DataTable`, `Alert`, `Snackbar`, and `Select` now route
  through the catalog, and `Calendar` / `DatePicker` fall back to the provider's
  `Intl` locale (the `locale` prop still wins). Catalog defaults match the prior
  hardcoded strings exactly, so default output is byte-identical.
- **`Combobox` multi-select, async, and create-option** (#39): a `multiple` mode
  (discriminated-union props: single → `string`, multi → `string[]`) that renders
  selected values as removable chips, toggles options while keeping the listbox
  open, removes the last chip on Backspace in an empty input, and marks the
  listbox `aria-multiselectable`; a `loading` affordance row plus a debounced
  `onQueryChange(query)` for server-side fetching (providing it disables
  client-side filtering); and `creatable` + `onCreate` for an `Add "{query}"`
  entry when nothing matches. Single-select sync behavior, controlled/uncontrolled
  symmetry, and FormField composition are unchanged.

### Changed

- `Chip.onDelete` now forwards its click event (non-breaking: a `() => void`
  handler still fits), so chip removal reports a real event.
- Cross-browser e2e: the cross-browser interaction spec (`interactions.spec.ts`,
  including the #34 overlay-anchoring guard that exercises the JS positioning
  fallback) now runs on WebKit and Firefox in addition to Chromium; axe and visual
  snapshots stay Chromium-only. CI/release install chromium + webkit + firefox.

## [2.9.0] - 2026-06-11

Quality and hardening release from a full multi-dimension code review of the
library (correctness, accessibility, conventions, build/types/security), plus a
few additive APIs and CI/supply-chain hardening. No breaking changes. Component
count unchanged (79). See `docs/AUDIT-REPORT.md`.

### Added

- **`useFieldControlProps(kind)`** (plus `FieldControlKind` / `FieldControlProps`):
  returns the ARIA wiring for a control composed inside a `<FormField>`, branched
  by role so each element only gets attributes it supports. A new FormField
  control contract test enforces this invariant across every form control.
- **`--ku-color-bg-selected`** token: a shared, brand-tinted selected/active-row
  surface used consistently across `Menu` / `CommandPalette` / `Sidebar` / `Tree`.
- Additive, non-breaking props and types: `Pagination` `previousLabel` /
  `nextLabel` / `getItemAriaLabel` (and `PaginationItemType`), `Alert` `closeLabel`,
  `Accordion` `headingLevel`, `Tree` `defaultSelectedId` (uncontrolled selection).
- `Button` solid variant hover/active feedback; `Chart` differentiates line series
  by stroke-dasharray and marker shape (not color alone, WCAG 1.4.1); `Chip`
  outline variant now honors `tone`; `Tooltip` reveals on touch tap.
- `@types/react` / `@types/react-dom` declared as optional peer dependencies; the
  `tailwind-preset` now exposes the `accent` tone (`bg-accent` / `text-accent-fg`).

### Fixed

- **Accessibility**: wired the FormField association (label, `aria-describedby`,
  required, and `aria-labelledby` for group controls) through `Checkbox`, `Switch`,
  `RadioGroup`, `Rating`, `Select`, `ColorPicker`, and `FileUpload`; removed ARIA
  attributes not valid on their role (`aria-required` / `aria-invalid` on
  button / group / dialog / switch roles) from `FileUpload`, `ColorPicker`,
  `Select`, `Switch`, `Menu`, and `Popconfirm`; gave overlays accessible names and
  focus return (`DatePicker`, `ConfirmDialog`, `Popconfirm`); made keyboard nav
  RTL-aware (`Carousel`, and others); added live-region announcements (`Carousel`,
  `TagInput`, `Snackbar`); made hover tooltips dismissable with Esc; and fixed
  light-theme invisibility where `bg-raised` equals `bg-default` (`Menu`, `Skeleton`).
- **Correctness**: `ConfirmDialog` can no longer get stuck closed when Esc is
  pressed while `confirmLoading`; `NumberField` preserves intermediate/trailing
  decimals in real browsers (it now uses a text buffer, not a number input);
  `mergeRefs` honors React 19 ref-cleanup functions; `useForm` clears a field's
  stale error/touched/dirty on unregister; a bound `<FormField required>`
  re-validates when `required` toggles at runtime; plus edge-case fixes in
  `Breadcrumbs`, `Calendar`, `Combobox`, `CountUp`, `HoverCard`, `Tabs`, and
  `TagInput`; and the theme provider now guards `localStorage` access against
  throwing (sandboxed iframes / blocked storage / quota).
- **Type-safety**: form-binding values are narrowed at runtime instead of cast
  (`NumberField`, `ColorPicker`, and others); fixed a `Toaster` barrel-export name
  that never reached the package root.

### Changed

- Selected/active-item styling is consolidated onto the `bg-selected` token across
  `Menu` / `CommandPalette` / `Sidebar` / `Tree` (`Tabs` keeps its underline).
- `Menu` disabled items use `aria-disabled` (kept in the accessibility tree)
  instead of the native `disabled` attribute.
- CI / release hardening: the release gate verifies the tag matches
  `package.json` and skips pre-releases; the full e2e suite runs (no more
  silently-skipped tests); GitHub Actions are pinned to commit SHAs with
  Dependabot; `verify:bundle` runs on PRs; and `update-baselines` refuses to run
  on `main`. Added guards (a barrel-export completeness test and a token-reference
  test), Playwright browser tests for the jsdom-masked fixes, and a retry for the
  transient axe "already running" flake.

## [2.8.0] - 2026-05-27

Additive release: the issue #43 component round-out (7 new components) plus a
ConfirmDialog enhancement (#57). No breaking changes. Component count 72 → 79.

### Added

- **`Banner`** — page-level notice with a severity vocabulary (info/success/
  warning/danger), distinct from the transient `Alert`/`Toaster`.
- **`ButtonGroup`** — segmented cluster of attached buttons sharing one border.
- **`SplitButton`** — a primary action with an attached dropdown menu of related
  actions.
- **`Meter`** — a `role="meter"` measurement gauge with threshold tones (a static
  measured value, distinct from `Progress`).
- **`NotificationBadge`** — count / dot overlay for anchoring a badge to an icon
  or avatar.
- **`Popconfirm`** — inline confirmation popover for a lightweight, in-context
  confirm without a modal `Dialog`.
- **`ColorPicker`** — saturation/value + hue + alpha + hex input + swatch picker,
  built on pure color-math helpers (`parseHex`/`toHex`/`hsv`).

### Changed

- **`ConfirmDialog`** — adds a loading/pending confirm state (guards against
  double-submit and reflects async progress) plus a `warning` tone (#57).

## [2.7.0] - 2026-05-26

Additive release making the design system adoptable by Tailwind CSS consumers
(e.g. koduh-mail-web) and filling the gaps a like-for-like comparison revealed.
No breaking changes. See `docs/tailwind-consumer-compatibility.md`.

### Added

- **Class-based theming** — the generated `dist/theme.css` now applies its
  dark/light overrides under a `.dark` / `.light` class in addition to the
  `[data-theme]` attribute, so apps using Tailwind's `darkMode: 'class'` get the
  design tokens automatically. `:root` stays dark-by-default; a class-strategy app
  whose light state is "no class" toggles `.light` explicitly.
- **`@koduhai/design-system/tailwind-preset`** — a new entry point mapping the
  semantic color tokens (and the brand ramp) onto Tailwind's `theme.extend.colors`
  as `var(--ku-*)` variables (e.g. `bg-primary`, `text-fg-muted`, `bg-surface`,
  `bg-chart-1`, `bg-brand-600`). Colors + fontFamily only — it deliberately does
  not map spacing/radius/fontSize, so it never clobbers Tailwind's built-in scales.
- **Brand tint ramp** — a fixed, theme-independent 10-step ramp
  (`--ku-brand-50 … --ku-brand-900`, anchored on the light `primary` `#1B5FCC`),
  exposed via the preset as `bg-brand-*` / `text-brand-*`.
- **`PasswordInput`** — a labelled password field with an accessible, keyboard-
  reachable show/hide toggle (`aria-pressed` / `aria-label`), error/helper text,
  density, and `FormField` integration.
- **`CountUp`** — an animated number that counts up to a target value with an
  ease-out curve, honoring `prefers-reduced-motion` (renders the final value
  instantly); supports `decimals` and a custom `format`.

## [2.6.0] - 2026-05-25

Additive release adding a form **orchestration** layer on top of the existing
`FormField`/`useField` field layer (issue #38). No breaking changes — standalone
field usage is unchanged.

### Added

- **`useForm` + `<Form>`** — a headless form store (values, errors, touched/dirty,
  `isSubmitting`, `submitCount`) with immutable updates. Field state is subscribed
  per-field via `useSyncExternalStore`, so a keystroke re-renders only that field.
  `<Form form={api}>` renders a native `<form>` and wires submit
  (`onValid`/`onInvalid`); `handleSubmit` validates, focuses the first invalid field,
  and guards against concurrent double-submit.
- **Validation** — a pluggable `resolver` (sync or async) plus per-field rules;
  resolver errors win on conflict. `standardSchemaResolver(schema)` adapts any
  [Standard Schema](https://standardschema.dev) validator (zod/valibot/arktype) with
  **no hard dependency** (zero-runtime-deps policy preserved).
- **`useFormField(name, rules?)`** — subscribes to one field's slice (value, error,
  touched, dirty) with `onChange`/`onBlur`/`setValue` handlers.
- **`useFieldArray(name)`** — stable-keyed `fields` plus `append`/`prepend`/`insert`/
  `remove`/`move`/`replace` for repeating field groups.
- **`<FormErrorSummary>`** — accessible (`role="alert"`, labelled) summary listing
  invalid fields; each entry focuses its field on activate. Renders nothing when valid.
- **Name-aware `FormField`** — `<FormField name="…">` inside a `<Form>` auto-wires
  value/onChange/onBlur into the wrapped input via a new optional `binding` on
  `FieldContext`; a bound `required` field validates on submit. Consumed additively by
  9 inputs (`TextField`, `Textarea`, `NumberField`, `PinInput`, `Select`, `Combobox`,
  `TagInput`, `DatePicker`, `ToggleGroup`) — an explicit `value` prop still wins, and
  standalone behavior is unchanged.

## [2.5.1] - 2026-05-25

Patch from a full component-consistency audit. No API changes.

### Fixed

- **RTL: residual physical CSS converted to logical properties** so the affected
  components mirror correctly under `dir="rtl"` (the #21 migration missed these):
  `Switch` thumb position + checked-state travel (via `inset-inline-start` and a
  `:dir(rtl)` translate flip), `Checkbox` input overlay, `Toaster` edge placements
  (`left`/`right` → `inset-inline-start`/`inset-inline-end`), and the `Table` /
  `DataTable` sort-icon borders. LTR rendering is unchanged.

### Internal

- Root-element CSS-module classes renamed to `root` in `Tooltip`, `HoverCard`, and
  `Popover` for naming uniformity (hashed module-local classes — no consumer impact;
  `Popover`'s `position-area` placement values are untouched).
- Documented the intentional convention exceptions (`Toaster`, `Code`,
  `LoadingButton`, `Text`'s typographic tone axis) and refreshed
  `docs/component_guidelines.md`.

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
