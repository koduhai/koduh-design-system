# Requirements: Component Expansion (`@koduhai/design-system` v1.1 + overlays)

**Status:** Draft for review
**Date:** 2026-05-22
**Author:** Koduh AI
**Extends:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (the v1 design)

---

## 1. Overview & Goals

v1.0 shipped the 12 planned components and deliberately excluded form controls, a
few presentational primitives, and all overlay components. This spec adds **12 new
components** in two phases, keeping every v1 architectural rule intact: zero runtime
dependencies, zero-runtime CSS Modules styling, tokens-as-CSS-variables, WCAG AA as
a hard requirement, and the four-layer architecture where no component reads another
component's internals.

**Primary goals:**

- Fill the most conspicuous v1 gap — **boolean/choice form controls** (`Checkbox`,
  `Radio`/`RadioGroup`, `Switch`) — alongside common presentational and navigation
  components (`Spinner`, `Skeleton`, `Divider`, `Accordion`, `Breadcrumbs`, `Tabs`).
- Reintroduce the deliberately-deferred **overlay components** (`Dialog`,
  `ConfirmDialog`, `Snackbar`) using a **native-first** approach — the browser's
  `<dialog>` element and the Popover API — so we get focus trapping, Escape handling,
  backdrop, and top-layer stacking **without** building from-scratch `Portal` or
  `FocusTrap` primitives. This was the specific accessibility risk v1 avoided; the
  native platform now removes it.
- Each new component follows `src/components/Button/` conventions exactly and ships
  with unit tests, stories, and zero-violation axe coverage in both themes.

**Success criteria:**

- All new components and their prop types exported from `src/index.ts` (the 12 existing
  components, plus the new ones — `RadioGroup` and `ConfirmDialog` are exported
  alongside `Radio` and `Dialog` respectively).
- All new components pass axe-core in dark **and** light themes (zero violations) and
  meet 4.5:1 text / 3:1 UI contrast.
- No new runtime dependencies; no `Portal`/`FocusTrap`/`Snackbar`-provider added to
  Layer 2. Tree-shaking still verified by `npm run verify:bundle`.
- The full gate (`typecheck`, `lint`, `test`, `build`, `test:e2e`) passes before each
  phase merges to `main`.

---

## 2. Non-Goals (YAGNI)

- **No hand-built `Portal` or `FocusTrap` primitives.** Overlays use native `<dialog>`
  (`showModal()` gives focus trap + Escape + backdrop + top-layer for free) and the
  Popover API for `Snackbar`. Layer 2 stays portal-free.
- **No Snackbar provider / notification queue / imperative `enqueue()` API.** `Snackbar`
  is a declarative, consumer-controlled component (like `Alert`, but top-layer
  positioned). Consumers manage their own queue if they need one.
- **No `DataTable`.** Sorting/pagination/selection remain a separate future effort;
  stays on the v0.x package.
- **No refactor of shipped v1 components.** `LoadingButton` keeps its internal spinner
  (it does **not** adopt the new `Spinner`); `PageHeader` keeps its inline breadcrumbs
  (it does **not** adopt the new `Breadcrumbs`). These are additive components. Reuse
  refactors are optional future cleanup, explicitly out of scope here.
- **No animation/motion system.** Plain CSS transitions only, `prefers-reduced-motion`
  honored (per the v1 reset).
- **No new theme tokens unless a component genuinely needs one** (e.g. `Dialog` may need
  a `--ku-z-dialog` / backdrop token). Prefer existing tokens; add to `tokens.ts` only
  when required, never hand-edit `dist/theme.css`.

---

## 3. Architecture

No change to the four-layer model. All new components are **Layer 3**; they consume
tokens via CSS variables and compose existing Layer 2 primitives (`Slot`/`asChild`,
`useId`, `useControllableState`, `composeEventHandlers`, `mergeRefs`,
`VisuallyHidden`, `cx`). The overlay components rely on **browser platform features**
rather than new primitives:

- `Dialog` renders a native `<dialog>` and synchronizes its imperative open/close
  (`showModal()` / `close()`) with a React `open` prop via a component-local effect,
  and wires the native `close`/`cancel` events back to `onClose`. The focus trap,
  Escape-to-close, inert background, and `::backdrop` are provided by the browser.
- `Snackbar` uses the **Popover API** (the `popover` attribute + `showPopover()`/
  `hidePopover()`) to render in the top layer without a portal, so it is not clipped by
  ancestor stacking/overflow contexts. It is non-modal (no focus trap).

The open/close-sync logic for `Dialog` is component-internal (a small local hook is
fine), **not** a shared Layer 2 primitive — keeping with the spec's preference to add
infrastructure only when a second consumer genuinely needs it.

---

## 4. Phasing & Delivery

Two independently shippable phases, each ending in a working, fully-tested state and a
fast-forward merge to `main` — mirroring how v1 Phases 1–3 shipped.

### Phase 5 — Tier 1 (9 components, zero new infra)

| Component              | Purpose                      | Key props (clean-break API)                                                                                                  | A11y notes                                                                                                                             |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Checkbox`             | Boolean form control         | `checked`/`defaultChecked`, `onChange(checked, event)`, `indeterminate`, `label`, `disabled`, `size`, `error`                | Native `<input type=checkbox>`; label linked via `useId`; `indeterminate` set on the DOM node; `aria-invalid` on error                 |
| `Radio` + `RadioGroup` | Single-choice form control   | `RadioGroup`: `name`, `value`/`defaultValue`, `onChange(value, event)`, `orientation`. `Radio`: `value`, `label`, `disabled` | Native `<input type=radio>`; group is a `role`-correct fieldset/`role=radiogroup`; arrow-key behavior is native within a shared `name` |
| `Switch`               | Toggle form control          | `checked`/`defaultChecked`, `onChange(checked, event)`, `label`, `disabled`, `size`                                          | `role="switch"` with `aria-checked`; label linked; color never the sole signal (thumb position + state)                                |
| `Spinner`              | Standalone loading indicator | `size`, `tone`, `label`                                                                                                      | `role="status"` + visually-hidden label when not purely decorative; `aria-hidden` when decorative; animation respects reduced-motion   |
| `Skeleton`             | Loading placeholder          | `variant` (`text`/`rect`/`circle`), `width`, `height`, `animation`                                                           | `aria-hidden` (decorative); shimmer disabled under `prefers-reduced-motion`                                                            |
| `Divider`              | Visual separator             | `orientation` (`horizontal`/`vertical`), `inset`, `children` (label)                                                         | `role="separator"` + `aria-orientation`; decorative variant uses `role="presentation"`                                                 |
| `Accordion`            | Expand/collapse disclosure   | `items` or compound API, `value`/`defaultValue`, `onChange`, `multiple`, `collapsible`                                       | Header is a `<button aria-expanded aria-controls>`; panel `role=region aria-labelledby`; no portal                                     |
| `Breadcrumbs`          | Navigation trail             | `items` (label + href), `separator`, `maxItems`                                                                              | `<nav aria-label="Breadcrumb">` wrapping an ordered list; current page `aria-current="page"`                                           |
| `Tabs`                 | Tabbed navigation            | `value`/`defaultValue`, `onChange`, `orientation`, compound `Tab`/`TabPanel`                                                 | `role=tablist/tab/tabpanel`; roving tabindex; arrow-key + Home/End nav; `aria-selected`/`aria-controls` linkage                        |

### Phase 6 — Overlays (3 components, native-first)

| Component       | Purpose                | Key props (clean-break API)                                                                                              | A11y notes                                                                                                                                           |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog`        | Modal dialog           | `open`, `onClose`, `title`, `size`, `dismissable` (Esc/backdrop), `footer`, children                                     | Native `<dialog>` via `showModal()`; browser provides focus trap, Esc, inert background; `aria-labelledby` → title; close button labeled             |
| `ConfirmDialog` | Confirmation prompt    | `open`, `onClose`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm`, `tone` (`primary`/`danger`)       | Composes `Dialog`'s public API; confirm/cancel are real `Button`s; focus starts on a sensible default action                                         |
| `Snackbar`      | Transient notification | `open`, `onClose`, `severity` (`info`/`success`/`warning`/`error`), `message`, `action`, `autoHideDuration`, `placement` | Popover API top-layer, non-modal; `role="status"` (polite) or `role="alert"` (error/assertive); auto-hide timer pauses on hover/focus; close labeled |

---

## 5. API Design Principles (carried from v1 §8)

- **Semantic prop vocabulary** — `tone` + `variant` + `size`, not MUI's `color`/`variant`
  overloading. `Switch`/`Checkbox`/`Radio` sizes align with the existing scale.
- **Controlled/uncontrolled symmetry** — every stateful component (`Checkbox`, `Switch`,
  `RadioGroup`, `Accordion`, `Tabs`, and the overlays) supports `value`/`defaultValue`
  (or `checked`/`defaultChecked`, `open`) with a single `onChange`/`onClose` contract
  via `useControllableState`.
- **`asChild` where polymorphism helps** — e.g. `Breadcrumbs` items rendering a router
  `<Link>`. Form controls render native inputs and do not need `asChild`.
- **DOM passthrough** — `className`, `id`, `data-*`, `aria-*`, and event handlers
  forward to the root. Props that collide with DOM attributes of a different type
  (`checked`, `onChange`, `orientation`, `title`, `value`, `open`) **must be `Omit`-ted**
  from the extended `HTMLAttributes`/`InputHTMLAttributes` and re-declared — this is a
  typecheck-only failure mode (see the v1 conventions). The integration session runs
  `npm run typecheck` to catch any an agent misses.
- **Icons accept any `ReactNode`** — components never force the in-house icon set.
- **Variant styling via data-attributes** (`data-variant`, `data-tone`, `data-size`,
  `data-state`), selected on in the `.module.css`, bridging tone→variant with CSS-local
  custom properties — exactly as `Button` does.

---

## 6. Testing & A11y

Same three-layer gate as v1, all green before each phase merges:

- **Vitest + Testing Library** per component for behavior (controlled/uncontrolled,
  keyboard interaction, indeterminate, open/close, auto-hide timers via fake timers).
- **`tsc --noEmit`** strict — the only place DOM-prop-collision `Omit` errors surface.
- **Playwright + axe-core** against Storybook stories in **both** dark and light themes,
  zero violations, plus visual-regression snapshots. Overlay stories must open the
  dialog/snackbar in the story so axe inspects the rendered overlay; document-level axe
  rules that don't apply to story fragments are disabled per-test as in
  `e2e/foundations.spec.ts`.
- Color is never the only signal (`Switch` thumb position, `Snackbar`/`Checkbox` icons +
  text). `prefers-reduced-motion` honored by `Spinner`/`Skeleton`/`Snackbar`.

**Browser-support note for overlays:** native `<dialog>` `showModal()`, `::backdrop`,
and the Popover API have broad baseline support in 2026; no polyfill is added. If a
target browser lacks support, the component degrades to a non-modal rendered element
rather than failing — validated during Phase 6.

---

## 7. Build & Integration Workflow

Follows the proven parallel-component workflow used for v1 Phases 1–3:

1. **Plan** — writing-plans produces one implementation plan per phase (mirroring the
   prior phases' plans), one task per component.
2. **Parallel subagents** — one subagent per component (Radio+RadioGroup share one;
   Dialog+ConfirmDialog share one due to the composition dependency). Each agent builds
   **only** its own `src/components/<Name>/` folder via TDD and runs **only** its own
   `npx vitest run <file>`. Agents do **not**: edit shared files (`src/index.ts`,
   `e2e/components.spec.ts`, `README.md`), run git, or run project-wide
   `typecheck`/`lint`/`build` (concurrent writes make those unreliable).
3. **Central integration** (this session) — wire `src/index.ts` exports + the e2e
   `COMPONENTS` array, run the **full gate**, regenerate visual baselines locally (these
   are gitignored / platform-specific — do **not** commit local snapshots), update the
   README status block, and make per-component + integration commits.
4. **Verify → branch + ff-merge to `main`.** Real axe failures (e.g. contrast) are fixed
   in the component, never by disabling the rule.

After both phases land, the maintainer bumps the version (e.g. to `1.1.0`), updates
`CHANGELOG.md`, and triggers the release (tag + GitHub Release) — publish/tag/push is
maintainer-controlled, as in v1.

---

## 8. Risks

| Risk                                                                                                        | Mitigation                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native `<dialog>` + React `open` state can desync (calling `showModal()` on an already-open dialog throws). | Guard the open/close effect with the dialog's current `open` state; build `Dialog` + `ConfirmDialog` in one agent so the sync logic is proven once before composition. |
| Popover API axe/visual testing inside Storybook story iframes may need the popover explicitly opened.       | Author overlay stories in their open state; follow the per-test axe-rule pattern from `e2e/foundations.spec.ts`.                                                       |
| DOM-prop collisions (`checked`, `onChange`, `orientation`, `open`, `value`) pass Vitest but fail typecheck. | Agents `Omit` colliding keys proactively; integration session runs `npm run typecheck` as a hard gate.                                                                 |
| `Tabs`/`Accordion`/`RadioGroup` keyboard semantics are easy to get subtly wrong.                            | Unit tests assert roving-tabindex / arrow-key / `aria-*` behavior explicitly; axe covers role correctness.                                                             |
| 9 parallel agents in Phase 5 is a large integration.                                                        | Two-phase split keeps each integration bounded; per-component commits keep history bisectable.                                                                         |
