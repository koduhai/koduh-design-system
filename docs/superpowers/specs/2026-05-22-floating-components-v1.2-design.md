# Requirements: Floating Components (`@koduhai/design-system` v1.2)

**Status:** Draft for review
**Date:** 2026-05-22
**Author:** Koduh AI
**Extends:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (v1 design)
and `docs/superpowers/specs/2026-05-22-component-expansion-v1.1-design.md` (v1.1 + overlays)

---

## 1. Overview & Goals

v1.0 shipped 12 components; v1.1 added 12 more (form controls, presentational,
navigation, and the native-first overlays `Dialog`/`ConfirmDialog`/`Snackbar`). This
spec adds **4 floating-UI components** built on a **native-first positioning
foundation**, extending the v1.1 overlay philosophy — use the browser platform
instead of hand-built infrastructure. Every v1 architectural rule stays intact: zero
runtime dependencies, zero-runtime CSS Modules styling, tokens-as-CSS-variables, WCAG
AA as a hard requirement, and the four-layer architecture where no component reads
another component's internals.

**Primary goals:**

- Add a public, generic **`Popover`** foundation that renders anchored content in the
  browser **top layer** via the **Popover API** (no portal, no clipping by ancestor
  `overflow`/stacking contexts) and positions it with **CSS Anchor Positioning**.
- Ship three consumers that compose `Popover`: **`Tooltip`**, **`Select`**, and
  **`Menu`** — covering the most conspicuous remaining gaps (a real `Select` form
  control, contextual tooltips, and an actions menu).
- Continue the v1.1 precedent of solving the hard platform problem (top-layer +
  positioning) **once**, with native features, rather than building a from-scratch
  `Portal`/`FocusTrap`/positioning engine into Layer 2.
- Each new component follows `src/components/Button/` conventions exactly and ships
  with unit tests, stories, and zero-violation axe coverage in both themes.

**Success criteria:**

- `Popover`, `Tooltip`, `Select`, and `Menu` (and their prop types) exported from
  `src/index.ts`.
- All new components pass axe-core in dark **and** light themes (zero violations) and
  meet 4.5:1 text / 3:1 UI contrast.
- No new runtime dependencies; **no** `Portal`/`FocusTrap` or positioning engine added
  to Layer 2. Tree-shaking still verified by `npm run verify:bundle`.
- The full gate (`typecheck`, `lint`, `test`, `build`, `test:e2e`) passes before the
  phase merges to `main`.

---

## 2. Non-Goals (YAGNI)

- **No hand-built `Portal`, `FocusTrap`, or JS positioning engine.** Top-layer
  rendering uses the native **Popover API**; placement uses **CSS Anchor Positioning**
  (`anchor-name`/`position-anchor`/`position-area` + `@position-try`). Layer 2 stays
  portal- and positioner-free.
- **`Select` is single-select only.** Multi-select is out of scope (matches v0.x
  parity, which had no `multiple`).
- **No `Autocomplete`/`Combobox`.** Free-text filtering over options is a separate
  future effort; it stays on the v0.x package.
- **No `DataTable` and no `DatePicker`.** Both remain deferred to dedicated future
  efforts on the v0.x package.
- **No refactor of shipped components.** These are additive; existing components are
  not rewired to consume `Popover`.
- **No animation/motion system.** Plain CSS transitions only, `prefers-reduced-motion`
  honored (per the v1 reset).
- **No new theme tokens unless a component genuinely needs one.** The Popover-API top
  layer handles stacking, so a `z-index` token is likely unnecessary; prefer existing
  spacing tokens for offsets. Add to `tokens.ts` only when required, never hand-edit
  `dist/theme.css`.

---

## 3. Architecture

No change to the four-layer model. All four new components are **Layer 3**; they
consume tokens via CSS variables and compose existing Layer 2 primitives
(`Slot`/`asChild`, `useId`, `useControllableState`, `composeEventHandlers`,
`mergeRefs`, `VisuallyHidden`, `cx`).

The foundation is a public, generic **`Popover`** that wraps two browser platform
features:

- **Popover API** (the `popover` attribute + `showPopover()`/`hidePopover()`) renders
  the floating content in the **top layer** without a portal, so it is never clipped
  by ancestor stacking/overflow contexts. This is the same mechanism `Snackbar`
  already uses. `Popover` is **non-modal** (no focus trap).
- **CSS Anchor Positioning** (`anchor-name` on the trigger, `position-anchor` /
  `position-area` on the floating element, `@position-try` fallback rules) provides
  placement and automatic flip/shift, with **zero JS positioning math**.

`Tooltip`, `Select`, and `Menu` compose `Popover`. The anchor-name/id linkage and the
React-`open` ↔ imperative-`showPopover()`/`hidePopover()` sync is **component-internal**
(a small local hook, mirroring `Dialog`'s native open/close sync) — **not** a shared
Layer 2 primitive, keeping with the spec's preference to add infrastructure only when a
second consumer genuinely needs it. If during the build the three consumers prove to
need byte-identical wiring, the integration session may extract a tiny helper shared
**within** `src/components/` floating components, but it is **not** promoted to Layer 2
unless clearly justified.

---

## 4. Components & API Design

API design principles carry from v1 §8 / v1.1 §5: semantic prop vocabulary
(`tone`/`variant`/`size`), controlled/uncontrolled symmetry via `useControllableState`,
`asChild` where polymorphism helps, DOM passthrough to the root, icons accept any
`ReactNode`, and variant styling via `data-*` attributes selected on in `.module.css`.

DOM-prop collisions (`open`, `value`, `onChange`, `placement`) **must be `Omit`-ted**
from the extended `HTMLAttributes` and re-declared — a typecheck-only failure mode the
integration session catches with `npm run typecheck`.

### Phase 7 — Floating components (foundation-first)

| Component | Purpose                    | Key props (clean-break API)                                                                                                                                                                       | A11y notes                                                                                                                                                                                                                                                                  |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Popover` | Generic anchored container | `open`/`defaultOpen`, `onOpenChange`, `anchor` (ref) **or** `asChild` trigger, `placement` (`top`/`bottom`/`left`/`right` × `start`/`end`), `offset`, `dismissable` (Esc/outside-click), children | Non-modal top-layer via Popover API; ARIA role is left to the consumer (it is a generic container); Esc and outside-click close when `dismissable`                                                                                                                          |
| `Tooltip` | Contextual label           | `content`, `placement`, `delay` (open/close), trigger via children/`asChild`                                                                                                                      | `role="tooltip"` + `aria-describedby` linkage to the trigger; opens on **hover and focus**; Esc dismisses; non-interactive content; transition honors `prefers-reduced-motion`                                                                                              |
| `Select`  | Single-choice form control | `value`/`defaultValue`, `onChange(value, event)`, `options` (`{value,label,disabled?}`), `placeholder`, `label`, `disabled`, `error`, `helperText`, `size`                                        | Trigger is a `<button>` with `aria-haspopup="listbox" aria-expanded`; popup `role="listbox"`, options `role="option" aria-selected`; Arrow/Home/End + type-ahead, Enter/Space select, Esc close; `aria-activedescendant`; label linked via `useId`; `aria-invalid` on error |
| `Menu`    | Actions menu               | `asChild` trigger, `items` (`{label, onSelect, disabled?, icon?}` + separator entries) **or** compound `Menu.Item`, `placement`                                                                   | Trigger `aria-haspopup="menu" aria-expanded`; popup `role="menu"`, items `role="menuitem"`; arrow-key nav + Home/End, Enter/Space activate, Esc + outside-click close; focus returns to the trigger on close                                                                |

**`Select` controlled/uncontrolled symmetry:** `value`/`defaultValue` with a single
`onChange(value, event)` contract via `useControllableState`, matching the v1.1 form
controls (`Checkbox`, `Switch`, `RadioGroup`).

**`Menu` API shape:** an `items` array is the primary API (covers row-action and
overflow-menu use cases declaratively); a compound `Menu.Item` form is offered for
custom item content. Separators are expressed as a sentinel entry in `items` (e.g.
`{ type: 'separator' }`) or a `Menu.Separator` in the compound form.

---

## 5. Phasing & Delivery

**One phase (Phase 7), foundation-first** — `Popover` is the shared dependency the
other three compose, so a fully-parallel build risks all three churning on a wrong
positioning contract. Instead we prove the foundation once, then parallelize the
consumers — mirroring how v1.1 de-risked `Dialog`+`ConfirmDialog` by proving the native
sync before composition.

1. **Plan** — writing-plans produces one implementation plan, `Popover` as the first
   task.
2. **Foundation-first** — build and prove `Popover` end-to-end (TDD, stories, axe in
   both themes) **before** the consumers exist, validating the Popover-API + CSS Anchor
   Positioning behavior (open/close, placement, flip/shift, graceful degradation) in one
   place.
3. **Parallel subagents** — one subagent each for `Tooltip`, `Select`, and `Menu`,
   composing the shipped `Popover`. Each agent builds **only** its own
   `src/components/<Name>/` folder via TDD and runs **only** its own
   `npx vitest run <file>`. Agents do **not**: edit shared files (`src/index.ts`,
   `e2e/components.spec.ts`, `README.md`), run git, or run project-wide
   `typecheck`/`lint`/`build`.
4. **Central integration** (this session) — wire `src/index.ts` exports + the e2e
   `COMPONENTS` array, run the **full gate**, regenerate visual baselines locally (these
   are gitignored / platform-specific — do **not** commit local snapshots), update the
   README status block, and make per-component + integration commits.
5. **Verify → branch + ff-merge to `main`.** Real axe failures (e.g. contrast) are fixed
   in the component, never by disabling the rule.

After the phase lands, the maintainer bumps the version to `1.2.0`, updates
`CHANGELOG.md`, and triggers the release (tag + GitHub Release) — publish/tag/push is
maintainer-controlled, as in v1/v1.1.

---

## 6. Testing & A11y

Same three-layer gate as v1/v1.1, all green before the phase merges:

- **Vitest + Testing Library** per component for behavior: `Select` listbox keyboard
  nav (Arrow/Home/End, type-ahead, Enter/Space select, Esc close) and
  controlled/uncontrolled; `Menu` arrow-key nav, activate, Esc/outside close, and
  focus-return-to-trigger; `Tooltip` hover/focus open, delay, Esc dismiss, and
  `aria-describedby` linkage; `Popover` open/close sync and `dismissable` behavior.
- **`tsc --noEmit`** strict — where DOM-prop-collision `Omit` errors (`open`, `value`,
  `onChange`, `placement`) surface.
- **Playwright + axe-core** against Storybook stories in **both** dark and light themes,
  zero violations, plus visual-regression snapshots. Floating stories must render in
  their **open** state so axe inspects the rendered popover/tooltip/listbox/menu;
  document-level axe rules that don't apply to story fragments are disabled per-test as
  in `e2e/foundations.spec.ts`.
- Color is never the only signal (`Select`/`Menu` selected state uses a check/marker +
  text, not color alone). `prefers-reduced-motion` is honored by any
  `Tooltip`/`Popover` transition.

**Browser-support note:** the Popover API has broad baseline support in 2026. **CSS
Anchor Positioning** support is still uneven across browsers in early 2026; no polyfill
is added. Where it is unsupported, the component **degrades gracefully** — it still
renders as a usable top-layer element at a sensible default placement rather than
failing — using `@position-try` fallbacks. This degradation is validated during Phase 7,
mirroring the Phase 6 native-overlay browser-support note.

---

## 7. Risks

| Risk                                                                                                  | Mitigation                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS Anchor Positioning support is uneven in early 2026; placement may not flip/shift on all browsers. | Build `Popover` foundation-first and validate degradation explicitly; ship `@position-try` fallbacks; accept graceful default-placement degradation as the contract. |
| `Select`/`Menu` keyboard semantics (roving focus, type-ahead, `aria-activedescendant`) are subtle.    | Unit tests assert keyboard behavior and ARIA linkage explicitly; axe covers role correctness; foundation-first proves open/close before the keyboard layers land.    |
| Popover-API + CSS-anchor interaction inside Storybook story iframes may need the popover opened.      | Author all floating stories in their open state; follow the per-test axe-rule pattern from `e2e/foundations.spec.ts`.                                                |
| A wrong `Popover` contract would force all three consumers to churn.                                  | Foundation-first single phase: prove and freeze the `Popover` API before the parallel consumer agents start.                                                         |
| DOM-prop collisions (`open`, `value`, `onChange`, `placement`) pass Vitest but fail typecheck.        | Agents `Omit` colliding keys proactively; integration session runs `npm run typecheck` as a hard gate.                                                               |
