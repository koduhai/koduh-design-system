# Component round-out (#43) — design

Six smaller, well-scoped components filling everyday gaps, each following the
established DS conventions: `forwardRef` + DOM passthrough, `data-*` variant
styling selected in CSS Modules, `cx(styles.root, className)`, logical CSS for
RTL, design tokens via `--ku-*` vars (never hardcoded color), prop types
exported from each `index.ts` and re-exported from `src/index.ts`, and
axe-clean Storybook stories in **both** dark and light themes. Reference
implementation: `src/components/Button/`.

All six are independent (no shared new infrastructure), so they're built as six
parallel worktree agents, then centrally integrated with the full gate
(typecheck, lint, unit tests, build). This branch rebases onto `main` after the
preceding batch (PR #56) lands, so ColorPicker/SplitButton build on the
post-#56 Slider (`setPointerCapture` pattern) and the `accent`/`info` tokens.

---

## 1. Popconfirm

Lightweight inline confirmation anchored in a `Popover` — the non-modal
counterpart to `ConfirmDialog`.

- **Composition:** wraps the existing `Popover` (`trigger`, `open`,
  `onOpenChange`, `placement`). Renders a small panel: optional title, message
  (`children`), then a `Cancel` + `Confirm` button row.
- **Props:** `trigger: ReactElement`, `title?: ReactNode`, `children: ReactNode`
  (message), `onConfirm: () => void`, `onCancel?: () => void`,
  `confirmLabel?: string = 'Confirm'`, `cancelLabel?: string = 'Cancel'`,
  `confirmTone?: ButtonTone = 'primary'` (set `'danger'` for destructive
  confirms), controlled `open?` / `onOpenChange?`, `placement?: PopoverPlacement`.
- **Behavior:** Confirm calls `onConfirm()` then closes (`onOpenChange(false)`);
  Cancel/outside-click/Esc call `onCancel?.()` and close. Confirm semantics
  mirror `ConfirmDialog` (#9): `onConfirm` fires before the close. Focus moves
  to the confirm button on open (matching `ConfirmDialog`'s default).
- **A11y:** Popover provides the dialog-ish panel + focus return to trigger;
  buttons are real `<button>`s. Message is associated via `aria-describedby`.

## 2. Banner

Persistent, page-level notice — distinct from inline `Alert`, transient
`Snackbar`/`Toaster`.

- **Props:** `severity: 'info' | 'success' | 'warning' | 'error'` (identical
  vocabulary to `AlertSeverity`, reusing the same default icon set and
  `role` mapping — `'alert'` for error/warning-class, `'status'` otherwise),
  `title?: ReactNode`, `children: ReactNode`, `icon?: ReactNode` (override;
  `null` hides), `dismissable?: boolean = false`, `onClose?: () => void`,
  `action?: ReactNode` (trailing CTA slot, e.g. a `Button`/`Link`).
- **Visual:** full-bleed width (spans its container), more prominent than the
  boxed inline `Alert`; severity color via `--ku-color-*`/`*-fg` tokens with a
  leading accent (border-inline-start or full tint). Dismiss is a labelled icon
  button (`aria-label="Dismiss"`).
- **Why separate from Alert:** Alert is an inline, in-flow message tied to a
  form/section; Banner is a page/region-level announcement. Same severity
  language keeps them predictable. No `open` prop — fire-and-forget `onClose`
  like `Alert`.

## 3. ButtonGroup

Presentational wrapper that visually joins adjacent `Button`s into a segmented
cluster (shared borders, collapsed inner radii).

- **Props:** `children` (a set of `Button`s), `size?: ButtonSize` (advisory —
  consumers still set it per Button; not forced), `orientation?: 'horizontal' |
'vertical' = 'horizontal'`, plus `aria-label`/DOM passthrough.
- **Rendering:** `role="group"` container; CSS collapses the inner border-radii
  and de-duplicates shared borders using **logical** properties
  (`border-start-start-radius` etc.) so it flips correctly under RTL and for
  vertical orientation.
- **Scope (YAGNI):** purely layout. It does **not** inject tone/variant into
  children or manage selection (that's `ToggleGroup`). Children own their props.

## 4. SplitButton

A primary action button with an attached caret that opens a `Menu` of secondary
actions.

- **Composition:** renders as a `ButtonGroup` of `[primary Button | caret
Button]`; the caret is the `Menu` trigger, reusing the existing
  `items: MenuEntry[]` API.
- **Props:** `children: ReactNode` (primary label), `onClick?: () => void`
  (primary action), `items: MenuEntry[]`, `tone?: ButtonTone = 'primary'`,
  `variant?: ButtonVariant = 'solid'`, `size?: ButtonSize = 'md'`,
  `disabled?: boolean`, `menuPlacement?: PopoverPlacement = 'bottom-end'`,
  `menuLabel?: string = 'More actions'` (caret button `aria-label`),
  `startIcon?` for the primary.
- **A11y:** caret button gets `aria-haspopup="menu"`/`aria-expanded` from Menu;
  the two buttons are independently focusable. `disabled` disables both.

## 5. Meter

Static measurement gauge — `role="meter"`, distinct from `Progress` (task
progress / `role="progressbar"`).

- **Props:** `value: number`, `min?: number = 0`, `max?: number = 100`,
  `low?: number`, `high?: number`, `optimum?: number`, `label?: ReactNode` /
  `aria-label?`, `formatValue?: (value: number) => string`, `size?: 'sm' | 'md'`,
  `showValue?: boolean = false`.
  - `max` defaults to **100** (percentage ergonomics, parity with how consumers
    use `Progress`), deviating from the HTML-native default of `1`. Any range is
    supported.
- **Tone derivation (WHATWG `<meter>` algorithm):** given `low`/`high`/`optimum`,
  the bar tone resolves to **good / caution / poor**:
  - If `optimum` is below `low` → lower is better; if at/above `high` → higher is
    better; otherwise the middle is best.
  - The segment containing `value` relative to the optimum region picks
    good (`success`) / caution (`warning`) / poor (`danger`). With no
    thresholds, tone is neutral/`primary`.
- **A11y:** `role="meter"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` and
  `aria-valuetext` (from `formatValue`). `aria-labelledby` → the label.
- **Visual:** a filled track like `Progress` but semantically a meter; tone color
  via the same `--ku-color-*` tone bridge pattern. Color is never the only
  signal — `showValue`/`aria-valuetext` carry the reading.

## 6. ColorPicker

Full color picker, FormField-composing.

- **Value:** controlled `value?: string` / `defaultValue?: string` as a hex
  string; `onChange?: (hex: string) => void`. Output is `#RRGGBB`, or 8-digit
  `#RRGGBBAA` when `alpha` is enabled and < 1. Internal state is HSV(A); hex is
  parsed in and serialized out at the boundary so dragging is smooth and lossless.
- **Props:** `value`/`defaultValue`/`onChange`, `alpha?: boolean = false`,
  `swatches?: string[]` (preset row; sensible default palette from the DS chart
  hues + neutrals), `disabled?: boolean`, `label?` + FormField wiring via
  `useOptionalFieldContext` (defers id/label/aria to an ancestor `<FormField>`),
  `id?`, DOM passthrough.
- **Surfaces:**
  1. **Saturation/Value square** — 2D draggable area (x = saturation, y = value)
     with a positioned handle; pointer-drag via the same `setPointerCapture`
     pattern Slider uses, plus arrow-key nudging.
  2. **Hue slider** — 0–360 horizontal slider.
  3. **Alpha slider** (when `alpha`) — 0–1 over a checkerboard.
  4. **Hex text input** — typed entry, validated/normalized on commit.
  5. **Swatch row** — clickable presets; selected swatch marked.
- **A11y:** each surface is keyboard-operable (`role="slider"` for hue/alpha,
  arrow keys on the SV square with `aria-valuetext` describing the color);
  swatches are buttons with color-name/hex `aria-label`s; the hex input is a
  labelled text field. Live color preview swatch has an accessible text readout
  of the current hex (color is not the only signal).
- **Internals factored for clarity:** a small `color.ts` helper module
  (`hsvToRgb`/`rgbToHsv`/`parseHex`/`toHex`) with its own unit tests, so the
  component file stays focused on interaction + rendering.

---

## Testing & a11y (all six)

- **Unit (Vitest + Testing Library):** render + variant `data-*` attributes,
  controlled/uncontrolled behavior, keyboard + pointer interaction (drag tests
  mock `getBoundingClientRect`, as Slider does), focus management (Popconfirm,
  SplitButton menu), and the color-math helpers (ColorPicker).
- **Types:** `tsc --noEmit` strict; every public prop type exported.
- **A11y (Playwright + axe):** new stories for each component in dark + light,
  zero violations. Visual baselines are regenerated on the Linux runner via the
  `update-baselines` workflow (never committed from local).

## Out of scope (YAGNI)

- ButtonGroup does not manage selection or inject child props (use `ToggleGroup`
  for selection).
- ColorPicker ships no popover-trigger wrapper in this batch (it's a surface;
  consumers can place it in a `Popover`/`Popconfirm` themselves). A bundled
  `<ColorPickerPopover>` can be a follow-up if demand appears.
- No i18n of the built-in strings here (`Confirm`/`Cancel`/`Dismiss`/`More
actions`) beyond making them props — central localization is issue #41.
