# Design: AvatarGroup, Stat, ToggleGroup, Drawer

**Date:** 2026-05-24
**Issue:** [#12 — Component gap analysis & proposed roadmap](https://github.com/koduhai/koduhai-design-system-v2/issues/12)
**Status:** Approved (brainstorming)

## Context

Issue #12 is the umbrella roadmap from dogfooding `koduh-console-demo`. Its P0 foundations
(layout, typography, FormField) and most P1 items shipped in v2.1–v2.2. This spec covers four
remaining P1 gaps the demo hit, all independent and self-contained:

- **AvatarGroup** — stacked avatars with `+N` overflow.
- **Stat** — the dashboard metric block the demo hand-rolled as `KpiCard`.
- **ToggleGroup** (a.k.a. SegmentedControl) — single/multi-select button group.
- **Drawer** — slide-in side/edge panel.

Each follows the established conventions in CLAUDE.md and `docs/component_guidelines.md`:
self-contained folder (`Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`,
`index.ts`), data-attribute variant styling, `cx(styles.root, className)`, `forwardRef` + DOM
prop spread, exports wired into `src/index.ts`, and dark+light axe e2e coverage with zero
violations. Built against current `main` (v2.2.0, 47 components).

---

## 1. AvatarGroup

Builds on the shipped `Avatar`. **`children`-based** because each `Avatar` is a standalone
control the consumer composes (guidelines §8).

```tsx
<AvatarGroup max={4} size="md">
  <Avatar name="Ada Lovelace" />
  <Avatar name="Linus Torvalds" src="…" />
  <Avatar name="Grace Hopper" />…
</AvatarGroup>
```

### Props

| Prop      | Type                             | Default     | Notes                                                                                                         |
| --------- | -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `max`     | `number`                         | `undefined` | Clamp visible avatars; render a `+N` overflow avatar when exceeded.                                           |
| `total`   | `number`                         | `undefined` | Override the overflow count for server-truncated lists (e.g. only 4 avatars rendered but 120 exist → `+116`). |
| `size`    | `AvatarSize`                     | `'md'`      | Propagated to all children + the overflow chip.                                                               |
| `shape`   | `AvatarShape`                    | `'circle'`  | Propagated to all children + the overflow chip.                                                               |
| `spacing` | `'tight' \| 'normal'`            | `'normal'`  | Overlap amount.                                                                                               |
| ...rest   | `HTMLAttributes<HTMLDivElement>` |             | Spread to root.                                                                                               |

### Behavior

- Root is a `<div>` with `cx(styles.root, className)` and `data-spacing`.
- `React.Children.toArray(children)`; if `max` set and count > `max`, render the first `max`
  (or `max - 1` when an overflow chip is needed) and append a `+N` overflow avatar.
- Overflow count = `(total ?? childCount) - visibleCount`.
- `size`/`shape` applied to each child via `cloneElement` so the overflow chip matches and the
  consumer doesn't repeat them per-avatar.
- Overlap via negative **logical** inline margin (`margin-inline-start`) on all but the first,
  so it flips in RTL. Each avatar gets a ring (`box-shadow`) in the page bg color so stacked
  avatars read as separated. Later avatars sit above earlier ones (DOM order + `position`).
- The overflow chip is an `Avatar`-styled element labeled `+N` with an accessible label
  (e.g. `aria-label="N more"`).

---

## 2. Stat

Presentational metric block. **Ships without card chrome** — composes into the existing `Card`
and `Grid` rather than duplicating surface styling (primitive philosophy).

```tsx
<Card>
  <Stat label="MRR" value="$48.2k" delta="12%" trend="up" icon={<TrendIcon />} />
</Card>
```

### Props

| Prop       | Type                             | Default     | Notes                                             |
| ---------- | -------------------------------- | ----------- | ------------------------------------------------- |
| `label`    | `ReactNode`                      | required    | The metric name.                                  |
| `value`    | `ReactNode`                      | required    | The metric value; rendered with tabular numerals. |
| `delta`    | `ReactNode`                      | `undefined` | Change indicator text (e.g. `"12%"`).             |
| `trend`    | `'up' \| 'down' \| 'neutral'`    | `'neutral'` | Drives delta color **and** a direction arrow.     |
| `icon`     | `ReactNode`                      | `undefined` | Optional leading/trailing accent icon.            |
| `helpText` | `ReactNode`                      | `undefined` | Sub-label below the value.                        |
| ...rest    | `HTMLAttributes<HTMLDivElement>` |             | Spread to root.                                   |

### Behavior

- Root `<div>` with `data-trend`. Internal layout uses the shipped `Stack`/`Text` primitives
  where natural, or plain elements styled via the module.
- `trend` maps to color tokens: `up` → success, `down` → danger, `neutral` → muted text.
  **Color is never the only signal** — an arrow glyph (↑/↓/—) accompanies the delta, and the
  delta has accessible text. The arrow is `aria-hidden`; the delta text carries meaning.
- Value uses the tabular/`numeric` `Text` variant for stable digit alignment.
- No border/background of its own; the consumer wraps it in `Card` when a surface is wanted.

---

## 3. ToggleGroup (SegmentedControl)

**Array-driven** `items` (owns item markup + a11y wiring, like Tabs/Select). A `type` prop
switches selection semantics. Reuses Tabs' roving-focus implementation.

```tsx
<ToggleGroup
  type="single"
  items={[
    { value: 'list', label: 'List', icon: <ListIcon /> },
    { value: 'grid', label: 'Grid', icon: <GridIcon /> },
  ]}
  value={view}
  onChange={setView}
/>
```

### Props

| Prop           | Type                                  | Default        | Notes                                                                                                |
| -------------- | ------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `items`        | `ToggleGroupItem[]`                   | required       | `{ value: string; label?: ReactNode; icon?: ReactNode; disabled?: boolean; 'aria-label'?: string }`. |
| `type`         | `'single' \| 'multiple'`              | `'single'`     | Selection mode.                                                                                      |
| `value`        | `string \| string[]`                  | `undefined`    | Controlled. `string` for single, `string[]` for multiple.                                            |
| `defaultValue` | `string \| string[]`                  |                | Uncontrolled initial.                                                                                |
| `onChange`     | `(value: string \| string[]) => void` |                | Fires with the next selection (typed per `type` at call sites via overloads where practical).        |
| `size`         | `'sm' \| 'md' \| 'lg'`                | `'md'`         |                                                                                                      |
| `tone`         | shared tone vocab                     | `'primary'`    | `primary \| neutral \| success \| warning \| danger`.                                                |
| `disabled`     | `boolean`                             | `false`        | Disables the whole group.                                                                            |
| `orientation`  | `'horizontal' \| 'vertical'`          | `'horizontal'` | Arrow-key axis.                                                                                      |
| ...rest        | `HTMLAttributes<HTMLDivElement>`      |                | Spread to root.                                                                                      |

### Behavior

- **`type="single"`** → root `role="radiogroup"`; each item is a `role="radio"` button with
  `aria-checked`. Roving focus (single tab stop, arrow keys move + select, Home/End), skipping
  disabled items — the exact pattern from `Tabs.tsx`.
- **`type="multiple"`** → root `role="group"`; each item is a toggle `<button>` with
  `aria-pressed`. All items are tab-stops (standard button group); arrow keys optional, Space/Enter toggle.
- Items with only an `icon` and no visible `label` **must** supply `aria-label` (enforced in
  stories/tests; documented in the prop).
- Selected state via `data-selected`; variant/tone/size via data-attributes on root + items.
- Composes with `FormField`: accepts `id` and `aria-*` (e.g. `aria-labelledby`,
  `aria-describedby`) on the root and forwards them.
- Uses `useControllableState` for controlled/uncontrolled symmetry.

---

## 4. Drawer

Slide-in edge panel built on the **native `<dialog>` + `showModal()`** mechanism — reuses
Dialog's focus-trap, backdrop, and Esc handling wholesale. Same overlay API as Dialog
(`open` / `onOpenChange`).

```tsx
<Drawer open={open} onOpenChange={setOpen} side="end" title="Filters" footer={<…/>}>
  …
</Drawer>
```

### Props

| Prop           | Type                                               | Default     | Notes                                                                                                           |
| -------------- | -------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `open`         | `boolean`                                          | required    | Modal open state.                                                                                               |
| `onOpenChange` | `(open: boolean) => void`                          | required    | Fires `false` on close (button/Esc/backdrop).                                                                   |
| `title`        | `ReactNode`                                        | `undefined` | Header heading + accessible name.                                                                               |
| `side`         | `'start' \| 'end' \| 'top' \| 'bottom'`            | `'end'`     | **Logical** sides so it flips in `dir="rtl"`. `start`/`end` map to inline edges, `top`/`bottom` to block edges. |
| `size`         | `'sm' \| 'md' \| 'lg'`                             | `'md'`      | Panel width (inline sides) or height (block sides).                                                             |
| `dismissable`  | `boolean`                                          | `true`      | Esc + backdrop click close.                                                                                     |
| `initialFocus` | `RefObject<HTMLElement \| null> \| string`         | `undefined` | Override native default focus target.                                                                           |
| `footer`       | `ReactNode`                                        | `undefined` | Footer actions.                                                                                                 |
| `children`     | `ReactNode`                                        |             | Body content.                                                                                                   |
| ...rest        | `Omit<HTMLAttributes<HTMLDialogElement>, 'title'>` |             | Spread to root.                                                                                                 |

### Behavior

- Mirrors `Dialog.tsx` structure: `dialogRef` synced to `showModal()`/`close()` guarding both
  directions; `close`/`cancel` listeners; backdrop-click close when `dismissable`; header with
  `title` + Close button; `body`; `footer`.
- Differs from Dialog only in **placement + animation**: the panel is pinned to one edge
  (full block-size for inline sides, full inline-size for block sides) and slides in via
  `transform: translate`. `data-side` drives both the inset and the transform direction, using
  logical properties (`inset-inline-start/end`, `inset-block-start/end`) for RTL correctness.
- `prefers-reduced-motion` disables the slide (reset already honors it; the module respects it
  per-component too).
- `aria-labelledby` wired to the title id when `title` is set (same as Dialog).

---

## Out of scope

- DatePicker/Calendar, Sparkline/Chart + categorical palette, density modes, lazy/keepMounted —
  remain open on #12 for future work.
- No new tokens required; trend colors reuse existing success/danger/text tokens.

## Testing & verification

For each component: Vitest behavior tests (render, controlled/uncontrolled, keyboard, overflow
math, RTL where relevant), `tsc --noEmit`, and Playwright + axe stories in both themes (zero
violations). Exports added to `src/index.ts` and prop types re-exported. `npm run build` green.
