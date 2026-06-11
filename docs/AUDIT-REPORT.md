Here is the synthesized code-review report.

---

# Code Review Synthesis: @koduhai/design-system

## 1. Executive Summary

**Overall verdict: healthy.** The library is functionally solid with strong, consistent conventions. There are no Critical findings and no shipped-and-broken defaults: every confirmed defect is either browser-specific, edge-case-triggered, or a polish/consistency gap. The single most important theme is that **a small set of a11y wiring conventions are not applied uniformly**, producing the same finding across many components.

**Counts by severity (94 confirmed findings):**

- Critical: 0
- High: 5
- Medium: 30
- Low: 59

**Top themes (recurring patterns matter more than one-offs):**

1. **FormField association is inconsistently wired (8+ components).** The `aria-describedby`/`aria-required`/label-association contract from `FieldContextValue` is forwarded by most controls but silently dropped by Checkbox, Switch, RadioGroup, Rating, FileUpload, Select (listbox), ColorPicker, and PinInput. This is the single largest class of findings and is fixable systemically.

2. **Overlay focus management is delegated but not always supplied.** `Popover` (the shared floating primitive) intentionally does no focus move-in/return; consumers must add it. Popconfirm (High), DatePicker, and bare Popover dialog usage ship without it, and several `role="dialog"` overlays also lack an accessible name (Popconfirm, DatePicker, Drawer).

3. **jsdom masks real-browser behavior in the test suite.** Two High findings (NumberField decimal buffer, ConfirmDialog Esc-while-loading) pass unit tests only because jsdom does not implement `<input type=number>` sanitization or native `<dialog>` cancel/close events. Real-browser (Playwright) coverage is missing for these interaction paths.

4. **RTL keyboard navigation is not mirrored.** Carousel, Tabs, ToggleGroup, and DataTable keyboard resize hardcode ArrowLeft/Right despite the codebase's own established `direction === 'rtl'` inversion pattern (Slider, ColorPicker, Breadcrumbs all do it correctly).

5. **Light-theme token collisions hide content.** `bg-raised === bg-default` (#FFFFFF) in light mode makes the Menu active-item highlight and Skeleton placeholder effectively invisible. A token-level fix resolves both.

6. **Convention drift in exports and tokens.** Several public prop types (`SpaceToken`, `GridColumns`, `Density`, Container's `SpaceToken`) are defined and locally exported but dropped from the `src/index.ts` barrel; a few CSS files reference `--ku-*` tokens the pipeline never emits.

---

## 2. Critical & High Findings

### Dialog / ConfirmDialog

**ConfirmDialog — Esc/native cancel not blocked while `confirmLoading`, dialog gets stuck closed** (High, correctness)
`src/components/Dialog/ConfirmDialog.tsx:67-78`
Esc routes through the native `<dialog>` cancel/close path, which bypasses the React-level `requestClose` guard: the browser runs `dialog.close()`, but `onOpenChange(false)` is swallowed so React `open` stays `true`, and the open-sync effect (keyed on `[open]`) never re-opens it. The dialog disappears mid-async, violating the documented "cannot be dismissed" guarantee.
**Fix:** pass `dismissable={!confirmLoading}` to `<Dialog>`; add a test dispatching a `cancel` event while `confirmLoading`.

### NumberField

**Raw text buffer on `<input type=number>` loses intermediate decimals in real browsers** (High, correctness)
`src/components/NumberField/NumberField.tsx:171-185`
The raw-buffer design (to keep `'1.'`/`'1.5'` through a render) cannot work: browsers sanitize `type=number` value, coercing invalid-number strings to `''`. The decimal-preservation tests pass only because jsdom treats `type=number` as `type=text`. In Chrome/Firefox/Safari the input blanks mid-edit.
**Fix:** use `type="text"` with `inputMode="decimal"` (+ `pattern`), or drop the buffer and accept native behavior. Add a Playwright test.

### Popconfirm

**`role="dialog"` popover gets no focus management (no move-in, no trap)** (High, accessibility)
`src/components/Popconfirm/Popconfirm.tsx:79-90`
Popover renders a plain `<div role="dialog">` via the Popover API with no focus move-in or Tab trap. A keyboard/SR user who opens the Popconfirm keeps tabbing through the rest of the page instead of reaching Confirm/Cancel, and focus is orphaned on close. (WCAG 2.4.3.)
**Fix:** move focus into the panel on open (Cancel/Confirm or panel), restore focus to the trigger on close.

### provider-theming

**`localStorage` access is unguarded against exceptions** (High, correctness)
`src/provider/KoduhThemeProvider.tsx:29-33, 75-82`
`getItem` runs inside the `useState` initializer and `setItem` in `persist()`, both without try/catch. In sandboxed iframes, locked-down storage policies, or on `QuotaExceededError`, a throw in the read path crashes the entire provider (and its subtree) on mount; a throw in write crashes `setMode`/`toggleMode`/`cycleMode`. The `typeof window` guards do not help, since storage access itself throws.
**Fix:** wrap read in try/catch returning the fallback; wrap write as a silent no-op.

---

## 3. Medium Findings

### Correctness

- **Breadcrumbs — `maxItems < 3` drops the current page + `aria-current`** `Breadcrumbs.tsx:35-44`
- **Calendar — paging the month can park roving focus on a disabled day-1 button (keyboard focus lost)** `Calendar.tsx:105-116, 195-201`
- **Combobox — selected label never resolves when options arrive async after the value is set** `Combobox.tsx:121-136`
- **CountUp — animation jumps backward when `value` changes mid-flight (`startRef` not updated on interrupt)** `CountUp.tsx:32-52`
- **FileUpload — drop on a disabled dropzone isn't `preventDefault`'d, so the browser navigates to/opens the file** `FileUpload.tsx:83-88`
- **Form — `unregister` leaks a field's error/value/touched/dirty state on unmount (stale errors persist)** `useForm.ts:204-208`
- **HoverCard — consumer `id` in `...rest` clobbers `cardId`, breaking the aria linkage** `HoverCard.tsx:122-127`
- **Tabs — tablist falls out of tab order when the selected tab is disabled (no keyboard entry point)** `Tabs.tsx:162-163`
- **TagInput — Backspace-to-remove reads internal `tags` instead of `currentValue`, breaking the Form-bound case** `TagInput.tsx:105-106`
- **primitives — `mergeRefs` swallows React 19 ref-cleanup functions returned by wrapped callback refs** `mergeRefs.ts:4-14`

### Accessibility — FormField association (the recurring class)

- **Checkbox — help/error `describedById` never wired (`aria-describedby` missing)** `Checkbox.tsx:79-97`
- **Checkbox — FormField `required` dropped (no `required`/`aria-required`)** `Checkbox.tsx:49-62`
- **Switch — FormField description/error not wired via `aria-describedby`** `Switch.tsx:42, 51-59`
- **RadioGroup — ignores FormField `describedById`** `RadioGroup.tsx:60-84`
- **Rating — FormField description/error not associated with the radiogroup** `Rating.tsx:129-142`
- **FileUpload — FormField `required` not exposed on the operable `role="button"` wrapper** `FileUpload.tsx:94-136`
- **FileUpload — FormField `<label>` targets the hidden input, not the operable wrapper** `FileUpload.tsx:125-137`
- **Select — listbox has no accessible name inside a FormField** `Select.tsx:326-336`
- **ColorPicker — visible label never associated with the control (orphaned in standalone + FormField)** `ColorPicker.tsx:62-67, 344-355, 358-419`

### Accessibility — overlays & names

- **DatePicker — popover dialog has no accessible name (`aria-dialog-name`)** `DatePicker.tsx:163-173`
- **DatePicker — focus not returned to trigger on Esc/outside-click** `DatePicker.tsx:109-115, 163-173`
- **ConfirmDialog — description not associated via `aria-describedby`** `ConfirmDialog.tsx:102`
- **Popconfirm — dialog can have no accessible name when `title` is omitted** `Popconfirm.tsx:58, 86`

### Accessibility — other

- **Carousel — arrow-key nav is not RTL-aware (reversed in RTL)** `Carousel.tsx:82-88`
- **Carousel — no live-region announcement on slide change** `Carousel.tsx:103-119`
- **CommandPalette — active option never scrolled into view during keyboard nav** `CommandPalette.tsx:142-165, 222-240`
- **ColorPicker — SV square has `role=slider` but no `aria-valuenow/min/max`** `ColorPicker.tsx:358-373`
- **Menu — active item has zero visible highlight in light theme (`bg-raised === bg-default`)** `Menu.module.css:26-28`
- **Skeleton — invisible in light theme (`bg-raised` equals white page bg)** `Skeleton.module.css:3`
- **Snackbar — live region is `display:none` until open, so appearance may not be announced** `Snackbar.module.css:26-28`
- **TagInput — no live-region announcement when tags added/removed** `TagInput.tsx:135-138`
- **Tooltip — hover-opened tooltip can't be dismissed with Esc (WCAG 1.4.13)** `Tooltip.tsx:95-106`
- **NotificationBadge — `dot` with no `label` is a color/shape-only signal** `NotificationBadge.tsx:63-73`

### Conventions / build-types-security

- **SplitButton — root doesn't spread remaining DOM props (`id`/`aria-*`/`data-*` can't reach the cluster)** `SplitButton.tsx:13-35, 58-59`
- **Tree — selection is controlled-only; no uncontrolled symmetry (no `defaultSelectedId`)** `Tree.tsx:78-80, 171`
- **ci-workflows — release publishes whatever `package.json` says; no tag↔version guard, fires on pre-releases** `release.yml:6-9, 65-72`

---

## 4. Low Findings

- **Accordion:** no arrow-key nav between headers (APG optional); heading level hard-coded to `<h3>`.
- **Alert:** dismiss label hardcoded English, no `closeLabel` override.
- **AppBar:** sticky uses `z-index:10`, ignores `--ku-z-index-appbar` (1100) token.
- **AspectRatio:** local CSS var `--ar` is unprefixed (collision risk).
- **Avatar:** no image-error fallback to initials; `src` with no `alt` becomes a decorative image, `name` unused as label.
- **AvatarGroup:** group container has no `role="group"`/accessible name.
- **Banner:** icon/dismiss vertically center against the whole block on multi-line banners (cosmetic).
- **Box:** `SpaceToken` exported from `Box/index.ts` but dropped from `src/index.ts`.
- **Breadcrumbs:** collapsed middle items permanently unreachable (inert ellipsis, no label); redundant `href` guard in link branch.
- **Button:** solid variant has no hover/active feedback.
- **ButtonGroup:** `role="group"` relies on consumer-supplied name with no enforcement/docs.
- **Calendar:** controlled `value` change to a different month doesn't move the grid; `role=grid` duplicates month label as `aria-label` instead of `aria-labelledby`.
- **Carousel:** `onIndexChange` fires for no-op navigations (same index).
- **Chart:** bar clusters overflow/overlap at 0.5px min bar width; line vs bar x-mappings disagree (bars not centered under category); series distinguished by color alone; dead pluralization branch always yields `'series'`.
- **Chip:** outline variant silently ignores `tone`; `role=button` span activates Space on keydown not keyup.
- **Code:** `CodeBlock` forwards className/props to inner `<pre>` while the visual root is the wrapper `<div>`; scrollable `<pre>` not keyboard-reachable; inline code `white-space:nowrap` overflows narrow viewports; language label fully `aria-hidden`.
- **ColorPicker:** live region re-announces full hex every drag tick; initial `hexDraft`/`hsv` can mismatch a Form-bound value on first render; unchecked `as string` cast on binding value.
- **Combobox:** Esc closes without resetting `activeIndex` (stale highlight on reopen); ArrowUp doesn't open the listbox and ArrowDown reuses a stale `activeIndex`.
- **Container:** `SpaceToken` not exported from `index.ts`.
- **DataTable:** resize separator omits `aria-valuemin/max` and has no `aria-valuenow` until first resize; keyboard resize not RTL-aware; `onStateChange` fires every render with an inline callback; `resizeStep` changes not reflected in memoized header handlers.
- **DatePicker:** documented `onChange(null)` clear contract never fulfilled (no clear affordance); `aria-controls` references inner wrapper, not the dialog element.
- **Dialog:** backdrop-click dismissal fires on mouseup over backdrop even when press started inside the dialog (data-loss footgun for form dialogs).
- **Divider:** empty/whitespace label silently strips separator semantics.
- **Drawer:** no accessible name when `title` omitted; background page not scroll-locked while modal open.
- **FileUpload:** contradictory CSS comments on `.input` + dead `aria-label` on a `display:none` input.
- **Form:** async validation has no ordering guard (slow earlier run clobbers newer errors); `useFormField` never re-registers when rules change; `useFieldArray` move/insert with out-of-range index yields `undefined` items and lying id assertions.
- **FormField:** bound `required` rule registered once, not updated if `required` toggles at runtime.
- **Grid:** public `GridColumns` not re-exported from `index.ts`/`src/index.ts`.
- **HoverCard:** `cloneElement` overwrites a consumer's existing `aria-describedby`/`aria-details` on the trigger.
- **Inline:** `SpaceToken` not re-exported at the package root (collision-avoidance side effect).
- **LoadingButton:** spinner silently broken under `asChild`; `disabled` attribute doesn't block interaction on non-button `asChild` elements.
- **Menu:** disabled menuitems use native `disabled` instead of `aria-disabled`; no first-letter typeahead.
- **Meter:** `role="meter"` can have no accessible name when `label` omitted; value/min/max not clamped (invalid `aria-valuenow`); empty placeholder `<span>` layout hack; `low/high/optimum` not constrained to `[min,max]`.
- **NotificationBadge:** count badge with no `label` exposes a bare number to AT; no guard against negative/non-integer `count`.
- **NumberField:** typed values never clamped to min/max (only buttons/arrows clamp); unchecked `as number | null` cast on binding value.
- **Pagination:** prev/next chevron glyphs don't flip in RTL; per-button `aria-label`s hardcoded English.
- **PinInput:** trailing-whitespace strip drops space chars when `type="text"`; `role="group"` can lack an accessible name standalone.
- **Popover:** no focus management for the floating panel (delegated to consumers); JS fallback position goes stale on panel size changes (no `ResizeObserver`).
- **Progress:** no `aria-valuetext` so non-percent scales announce a bare number; `NaN` value flows through to `aria-valuenow="NaN"`/`width:NaN%`.
- **Radio:** visually-hidden input is `position:absolute` with no positioned ancestor (escapes the label box).
- **Rating:** keyboard nav can't clear to 0 and ArrowLeft at star 1 re-selects 1; arrow nav fires `onChange` even when value unchanged.
- **ScrollArea:** `tabIndex={0}` applied unconditionally; the "browsers ignore it" comment is false.
- **Select:** active option never scrolled into view during keyboard nav.
- **Sidebar:** toggle's `aria-expanded`/`aria-controls` imply a disclosure the list never performs; `collapseBelow` effect re-subscribes/re-fires on unstable handler identity.
- **Skeleton:** rect/circle variants collapse to zero height when width/height omitted.
- **Slider:** Form-bound value rendered without clamp/snap (out-of-range `aria-valuenow`/fill); `step <= 0` yields `NaN`; em-dash in the generated label readout (writing-rule violation).
- **Snackbar:** dead `--ku-z-snackbar` token reference (literal 1400 always wins).
- **Sparkline:** single-datum line/area renders nothing visible; non-finite data poisons path/label output.
- **Stepper:** `aria-current` sits on the `<li>`, not the active step's `<button>`.
- **Switch:** no standalone `error`/invalid prop (invalid only inside FormField); FormField `required` not forwarded to the input.
- **Table:** sortable column renders a focusable no-op button when `onSortChange` omitted.
- **Tabs:** `onChange` re-fires when clicking the already-selected tab; horizontal arrow keys not mirrored for RTL.
- **TagInput:** forwarded `name` lands on the draft input, so native form submit posts in-progress text, not the tags.
- **TextField:** no visual disabled state on the field wrapper/adornments; unsafe `as string` cast on the binding value.
- **Textarea:** `autoResize` effect never cleans up inline height/overflow when toggled off.
- **Toaster:** overflow toasts beyond `max` never start their auto-dismiss timer; an `Infinity` toast ahead of them stalls the queue.
- **ToggleGroup:** roving `tabIndex` goes stale when value changes externally; `aria-required` emitted on `role="group"` (unsupported for that role).
- **Tooltip:** `cloneElement` clobbers a consumer's `aria-describedby` on the trigger; no touch affordance / hover-focus only (undocumented).
- **Tree:** roving tabindex doesn't follow the last-focused row; `rowRefs` map entries set to `null` on unmount but never deleted.
- **token-pipeline:** HoverCard references `--ku-line-height-normal`, a token the pipeline never emits (no fallback) — `HoverCard.module.css:6`.
- **tailwind-preset:** `accent` tone dropped from the preset; semantic tone mapping is hand-listed and drifts silently.
- **build-exports-config:** `@types/react`/`@types/react-dom` not declared as optional peer deps; `verify:bundle` runs only at release, not in CI; Table's `Density` type not re-exported from `src/index.ts`; `styles.css` export depends on a non-fatal post-build copy step.
- **ci-workflows:** third-party actions pinned to mutable major tags (`@v6`/`@v7`), not SHAs; `update-baselines.yml` can push to `main` with the default token; merge gate splits e2e by `--grep axe`/`--grep visual` so untitled tests silently never run (already true of the `#34` regression test).

---

## 5. Cross-Cutting Recommendations

These systemic fixes each resolve a whole class of findings:

1. **Centralize FormField wiring into a single shared hook/spread (resolves 9 Medium a11y findings).** Most controls already do `aria-describedby={field ? field.describedById : ...}`, `aria-required={isRequired}`, and label association correctly; the outliers (Checkbox, Switch, RadioGroup, Rating, FileUpload, Select listbox, ColorPicker, PinInput) simply forgot one or more. Expose a `useFieldControlProps()` (or extend the existing `useField.controlProps`) that returns `{ id, 'aria-describedby', 'aria-required', 'aria-invalid', 'aria-labelledby' }` and have every FormField-aware control spread it. Add a contract test that mounts each control inside a `<FormField required errorText="...">` and asserts the operable element carries `aria-describedby`, `aria-required`, and a resolvable name. This converts an open-ended audit into a single enforced invariant.

2. **Give `Popover` an opt-in focus-management mode and require a name for `role="dialog"` (resolves Popconfirm High + DatePicker/Drawer/Popconfirm name + focus-return findings).** Add a `manageFocus`/`modal` prop (or a small `useDialogFocus(panelRef, triggerRef, open)` helper) that moves focus in on open and restores it on close/Esc, and warn (dev-only) when `role="dialog"` is set without `aria-label`/`aria-labelledby`. Composing overlays (Popconfirm, DatePicker) then inherit correct behavior instead of each reimplementing it.

3. **Add real-browser (Playwright) interaction tests for jsdom-masked paths.** The two High correctness findings (NumberField decimals, ConfirmDialog Esc-while-loading) and several Medium ones (FileUpload disabled drop, Tabs disabled-selected entry point) are invisible to jsdom. A small Playwright spec exercising decimal entry, native `<dialog>` cancel, and drag-drop on disabled zones would have caught all of them. Pair this with fixing the e2e merge gate (recommendation 6) so new interaction tests actually run.

4. **Introduce a shared `direction === 'rtl'` arrow-key helper and apply it to all keyboard-nav components.** Slider/ColorPicker/Breadcrumbs already invert correctly; Carousel, Tabs, ToggleGroup, and DataTable keyboard resize do not. Extract the existing pattern into one utility and adopt it everywhere horizontal arrows map to prev/next.

5. **Fix the light-theme `bg-raised === bg-default` collision at the token level (resolves Menu + Skeleton invisibility).** Either give `bgRaised` a value distinct from `bgDefault` in the light theme, or introduce a dedicated `bg-selected`/placeholder surface token, and add a `contrast.test.ts` assertion that active/placeholder surfaces differ from the page surface by a perceptible margin in both themes. Consider a second non-color signal (inset ring) on the Menu active item for defense in depth.

6. **Harden the release/CI pipeline as a batch.** Add a tag↔`package.json` version guard and a `prerelease == false` gate to `release.yml`; run `verify:bundle` in CI (not just at release); replace the `--grep axe`/`--grep visual` e2e partition with explicit `@axe`/`@visual` tag annotations (or one full-suite run) so untitled tests can't be silently skipped; and pin GitHub Actions to commit SHAs (at minimum in the privileged `release.yml`). Each is a small, independent PR.

7. **Add a barrel-export and token-reference lint to kill convention drift.** A generator/test that (a) asserts every type exported from a component `index.ts` is re-exported from `src/index.ts` (catches `SpaceToken`, `GridColumns`, `Density`, Container) and (b) fails the build when a component CSS references a `--ku-*` custom property the pipeline doesn't emit without a fallback (catches `--ku-line-height-normal`, `--ku-z-snackbar`). Consider hoisting the byte-identical `SpaceToken` (6 copies) and the responsive-layout helpers into one shared module to remove both the duplication and the collision that forced the omissions.
