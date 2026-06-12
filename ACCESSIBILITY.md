# Accessibility

`@koduhai/design-system` targets **WCAG 2.1 AA** as a hard requirement.

## Automated coverage

- **axe-core** runs against every component's Showcase story in **both dark and
  light themes** via Playwright (`e2e/components.spec.ts`). The `COMPONENTS`
  array in that spec is the enforcement mechanism — currently **zero violations**
  across all 81 shipped components (plus the icon gallery). Floating content
  (`Select`/`Menu`) is opened by the harness so axe inspects the live
  listbox/menu, and the virtualized `DataTable` is covered as a separate target.
- Document-structure rules that don't apply to isolated story fragments
  (`landmark-one-main`, `page-has-heading-one`, `region`) are disabled per-test
  with documented justification; component-level rules (contrast, names, roles,
  landmark uniqueness) are always enforced.
- Type safety (`tsc --noEmit`) and unit tests assert ARIA wiring
  (`aria-describedby`, `aria-current`, `aria-expanded`, `aria-invalid`, roles).

## Principles enforced

- **Color is never the only signal.** StatusBadge pairs color with a text label
  and dot; Alert pairs color with an icon and role; the Sidebar active item uses
  high-contrast text + a primary accent bar + weight (not color alone).
- **Visible focus.** `reset.css` provides a `:focus-visible` ring; no component
  removes outlines without replacement.
- **Reduced motion.** `prefers-reduced-motion` is honored in the reset; the only
  animation (the LoadingButton spinner) is decorative and `aria-hidden`.
- **Keyboard operable.** All interactive elements are native `<button>`/`<a>`/
  `<input>` (or `asChild` preserving the correct role); nothing relies on
  pointer-only interaction.

## Per-component notes

| Component              | Key a11y measures                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button / LoadingButton | native `<button>`; `asChild` keeps the link role; `aria-busy` + disabled while loading; screen-reader-only loading text                                                                              |
| Chip                   | a clickable chip is a `<button>`; the delete affordance is a labeled button                                                                                                                          |
| Avatar                 | `alt` on the image; initials fallback gets an `aria-label`                                                                                                                                           |
| StatusBadge            | a text label is always present; color + dot are secondary signals                                                                                                                                    |
| Alert                  | `role="alert"` (error/warning) or `role="status"` (info/success); labeled close button                                                                                                               |
| TextField              | label↔input linked via `useId`; helper/error text via `aria-describedby`; `aria-invalid` on error; `required` reflected                                                                              |
| Card                   | semantic container; heading structure left to the consumer                                                                                                                                           |
| EmptyState             | configurable heading level; decorative icon is `aria-hidden`                                                                                                                                         |
| PageHeader             | `<header>`; configurable heading level; breadcrumbs in `<nav aria-label="Breadcrumb">`                                                                                                               |
| AppBar                 | `<header>` banner landmark; keyboard-reachable actions                                                                                                                                               |
| Sidebar                | `<nav>` landmark; labeled collapse toggle (`aria-expanded`/`aria-controls`); active item `aria-current="page"`; collapsed labels stay in the accessibility tree (clip technique, not `display:none`) |
| Banner                 | `role="alert"` (error/warning) or `role="status"` (info/success); decorative icon is `aria-hidden`; labeled dismiss button                                                                          |
| Checkbox               | native `<input type="checkbox">` inside `<label>`; indeterminate via the DOM property; composes FormField for `aria-describedby`/`aria-invalid`                                                       |
| Radio / RadioGroup     | native `<input type="radio">` inside `<label>`; group is `role="radiogroup"` with `aria-orientation`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`; radios share `name`    |
| Switch                 | native `<input type="checkbox" role="switch">` inside `<label>`; FormField-aware (`aria-describedby`/`aria-invalid`); omits `aria-required` (invalid on `role="switch"`)                             |
| Spinner                | `role="status"` + `aria-live="polite"` with a visually-hidden label when labeled; `aria-hidden` when purely decorative                                                                               |
| Skeleton               | `aria-hidden="true"` — pure loading decoration, kept out of the accessibility tree                                                                                                                   |
| Divider                | unlabeled = `role="separator"` + `aria-orientation`; labeled = `role="presentation"` (the visible label conveys the meaning)                                                                         |
| Accordion              | trigger `<button>` with `aria-expanded` + `aria-controls`; panel `role="region"` + `aria-labelledby`; Arrow/Home/End roving focus across headers                                                     |
| Breadcrumbs            | `<nav aria-label>` wrapping an `<ol>`; current page is `aria-current="page"`; collapsed ellipsis keeps visually-hidden semantic text                                                                 |
| Tabs                   | `role="tablist"` + `aria-orientation`; tabs `role="tab"` with `aria-selected` + roving tabindex; panels `role="tabpanel"` + `aria-labelledby`; Arrow/Home/End with wrap                              |
| Dialog / ConfirmDialog | native `<dialog>` + `showModal()`/`close()`; `aria-labelledby` to the title (ConfirmDialog adds `aria-describedby`); focus moved in on open and restored on close; Esc/backdrop dismiss              |
| Drawer                 | native `<dialog>` + `showModal()`; `aria-labelledby` to title; Esc/backdrop dismiss; body scroll locked; focus to `initialFocus` or first focusable                                                  |
| Snackbar               | persistent live region — `role="alert"` + `aria-live="assertive"` for error, otherwise `role="status"` + `aria-live="polite"`                                                                        |
| Popover                | positioning layer only (Popover API or JS fallback); no role of its own — the composing component (Select/Menu/Tooltip) supplies the role                                                             |
| Tooltip                | `role="tooltip"` with an id; trigger gets `aria-describedby`; opens on hover/focus with a delay, dismissible via Esc/outside tap, and is hoverable (WCAG 1.4.13)                                      |
| Popconfirm             | `role="dialog"` with `aria-labelledby`/`aria-describedby`; trigger gets `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls`; focus trapped while open and restored on close                     |
| Select                 | trigger `<button aria-haspopup="listbox" aria-expanded>` labeled via `aria-labelledby`/`aria-describedby`; `role="listbox"` with `aria-multiselectable` when multi; options `role="option"` + `aria-selected`; `aria-activedescendant` tracks keyboard nav |
| Menu                   | trigger `<button aria-haspopup="menu" aria-expanded>`; `role="menu"` with `aria-activedescendant`; items `role="menuitem"` with `aria-disabled` (so disabled items stay in the tree); Arrow/Home/End/typeahead |
| TextField              | label↔input via `useId`; helper/error via `aria-describedby`; `aria-invalid` + `required` reflected; composes FormField                                                                              |
| PasswordInput          | native `<input>` with `aria-invalid`/`aria-describedby` (standalone or via FormField); show/hide toggle is a labeled `aria-pressed` button                                                            |
| Textarea               | native `<textarea>` with `aria-invalid`/`aria-describedby`; label via `<label htmlFor>` or FormField                                                                                                 |
| NumberField            | `<input type="text" inputmode="decimal">` with `aria-invalid`/`aria-describedby`; labeled stepper buttons; Arrow keys step, value clamped to min/max on blur                                         |
| Slider                 | `role="slider"` thumb with `aria-valuemin`/`max`/`now`/`valuetext`, `aria-labelledby`, `aria-describedby`, `aria-invalid`; Arrow/Home/End/PageUp/Down; RTL-aware                                      |
| TagInput               | `<input>` with `aria-invalid`/`aria-describedby`; tags render as `Chip`s; a `LiveRegion` announces add/remove; Enter/comma commits, Backspace removes the last tag                                    |
| Combobox               | `role="combobox"` input with `aria-expanded`/`aria-controls`; `role="listbox"` (with `aria-multiselectable` when multi) of `role="option"` + `aria-selected`; `aria-activedescendant` for nav; supports create-option |
| ColorPicker            | `role="group"` + `aria-labelledby`; SV/hue/alpha controls are each `role="slider"` with `aria-label`, `aria-valuemin`/`max`/`now`, `aria-valuetext`; labeled hex input                               |
| PinInput               | `role="group"` + `aria-label`/`aria-labelledby`; each cell input has an `aria-label` ("digit N of length") + `aria-invalid`; auto-advance/backspace between cells                                     |
| FileUpload             | `role="button"` drop zone with `aria-labelledby` (FormField label) + `aria-describedby` (instructions) + `tabindex=0`, fronting a hidden native `<input type="file">`                                |
| Rating                 | `role="radiogroup"` + `aria-label`/`aria-labelledby`; items `role="radio"` with `aria-checked` + roving tabindex                                                                                     |
| FormField              | the labelling orchestrator: links label↔control, wires `aria-describedby` for helper/error text, and propagates `aria-invalid` to the control via context                                            |
| Form / FormErrorSummary| `<form noValidate>`; `FormErrorSummary` is a focusable (`tabindex=-1`) `role="group"` labeled by its heading, focused on failed submit, with error links that move focus to the offending field      |
| Progress               | `role="progressbar"` with `aria-valuemin`/`max`/`now`/`valuetext`; labeled via `aria-label`/`aria-labelledby`                                                                                        |
| Meter                  | `role="meter"` with `aria-valuenow`/`valuemin`/`valuemax`/`valuetext`; requires `aria-label`/`aria-labelledby` (dev warning if absent)                                                                |
| Pagination             | `<nav aria-label>`; controls are labeled buttons; the active page carries `aria-current="page"`                                                                                                      |
| Table                  | semantic `<table>` with optional `<caption>`; `scope="col"` headers, `aria-sort` on sortable columns; selection checkboxes are labeled                                                                |
| DataTable              | wraps `Table` (toolbar/filters/footer); expandable rows use `aria-expanded`/`aria-controls`; resize handles are `role="separator"` with `aria-valuenow`/`valuemin` + keyboard control; virtualized variant sets `aria-rowcount` on the grid and `aria-rowindex` per row |
| Calendar               | ARIA grid (`role="grid"` → `row` → `gridcell`); day buttons carry `aria-selected`, `aria-current="date"` for today, and a full-date `aria-label`; Arrows/Home/End/PageUp/Down navigate, Enter/Space selects; range mode marks the span |
| DatePicker             | read-only `role="combobox"` input + trigger `aria-haspopup="dialog"`/`aria-expanded`; popover `role="dialog"`; composes `Calendar` plus an optional `TimePicker` for date+time                       |
| TimePicker             | `role="group"`; each segment is a `role="spinbutton"` with `aria-valuemin`/`max`/`now`/`valuetext` + `aria-label`; Arrows adjust, digits type, Backspace/Delete clears; locale-aware AM/PM            |
| DateRangePicker        | `role="group"` wrapping two labeled read-only inputs; trigger `aria-haspopup="dialog"`/`aria-expanded`; popover `role="dialog"` hosting `Calendar` in range mode                                      |
| Sparkline              | SVG `role="img"` + `aria-label` (auto-generated value summary or custom); inner SVG marked `aria-hidden`                                                                                             |
| Chart                  | SVG `role="img"` + `aria-label` (series summary or custom); visual SVG `aria-hidden`; a visually-hidden data table with caption provides the underlying values                                       |
| Stepper                | `<ol>`/`<li>` steps; the active step carries `aria-current="step"` (on the button when clickable, otherwise the `<li>`)                                                                              |
| Timeline               | semantic `<ol>`/`<li>`; the visual marker is `aria-hidden`                                                                                                                                            |
| Tree                   | `role="tree"` with `role="treeitem"` nodes carrying `aria-expanded` (parents), `aria-selected`, and roving tabindex; nested children in `role="group"`; Arrow-key navigation                         |
| Carousel               | `role="group"` + `aria-roledescription="carousel"`; slides `role="group"` + `aria-roledescription="slide"`, inactive ones `aria-hidden`; a `LiveRegion` announces position; indicators are `aria-current`/`aria-controls` buttons |
| CommandPalette         | native `<dialog>` hosting a `role="combobox"` input (`aria-expanded`/`aria-controls`) over a `role="listbox"` of `role="option"` items; `aria-activedescendant` tracks the active command            |
| Collapsible            | trigger `<button>` with `aria-expanded` + `aria-controls`; panel `role="region"` + `aria-labelledby`                                                                                                 |
| HoverCard              | trigger cloned with `aria-describedby`/`aria-details` to the card; card rendered via the platform Popover API                                                                                        |
| ScrollArea             | scroll container that becomes focusable (`tabindex=0`) only when its content overflows, per the APG scrollable-region pattern                                                                        |
| Code / CodeBlock       | inline `Code` is a native `<code>`; `CodeBlock` is `<pre>` with `tabindex=0` for keyboard scroll, an optional `aria-label` when a language is set, and an `aria-hidden` language badge               |
| Kbd                    | native `<kbd>` element; no extra ARIA needed                                                                                                                                                          |
| AspectRatio            | presentational ratio-constraining `<div>`; no role or ARIA                                                                                                                                            |
| CountUp                | `<span>` that animates a numeric value; presentational, no ARIA                                                                                                                                       |
| ButtonGroup            | `role="group"` clustering related buttons (supply an `aria-label` to name the cluster)                                                                                                                |
| SplitButton            | `ButtonGroup` of a primary `Button` + a `Menu` trigger; the caret button has `aria-label="More actions"` and an `aria-hidden` icon                                                                   |
| Toaster                | `role="region"` + `aria-label`; individual toasts announce via their own live regions                                                                                                               |
| NotificationBadge      | decorative dot is `aria-hidden`; the count is exposed through a `VisuallyHidden` label (e.g. "3 notifications")                                                                                       |
| AvatarGroup            | `role="group"` with an optional `aria-label`; the overflow chip carries an `aria-label` with the remaining count                                                                                     |
| ToggleGroup            | `role="radiogroup"` (single) or `role="group"` (multiple); buttons use `aria-checked` (radio) or `aria-pressed` (toggle); roving tabindex; Arrow/Home/End                                            |
| Stat                   | no ARIA roles; the trend arrow is `aria-hidden` and its meaning is exposed via `VisuallyHidden` text (e.g. "Increased:")                                                                              |
| DescriptionList        | semantic `<dl>` with `<dt>`/`<dd>` pairs; native term↔definition structure, no extra ARIA                                                                                                            |
| Link                   | native `<a>` (href); `asChild` preserves the link role for router links; no extra ARIA required                                                                                                       |
| Heading                | renders `<h1>`–`<h6>` per `level`; native heading semantics, no ARIA needed                                                                                                                          |
| Text                   | polymorphic element (default `<span>`) via `as`/`asChild`; role is whatever the chosen element/context implies                                                                                       |
| Stack / Inline / Grid / Container / Box | presentational layout wrappers (`<div>` by default, `asChild`/`as` for polymorphism); no semantic role or ARIA of their own                                                          |

## Known limitations / out of scope

- Overlays (`Dialog`, `Drawer`, `Snackbar`, `Popover`, `Tooltip`, `Select`,
  `Menu`, `Popconfirm`, date pickers, `CommandPalette`) are built on platform
  primitives rather than a portal/focus-trap library: native `<dialog>` +
  `showModal()` for modals (Dialog/Drawer/CommandPalette) and the Popover API +
  CSS anchor positioning for floating layers. The Popover API and anchor
  positioning are Chromium-first; Firefox/Safari fall back to JS positioning, so
  re-verify floating placement there if you target those browsers.
- axe verifies contrast on the Showcase stories with the shipped tokens. Bespoke
  consumer color overrides are the consumer's responsibility to re-check.

## Running the audit locally

```bash
npm run test:e2e -- --grep axe   # axe on every component, both themes
```
