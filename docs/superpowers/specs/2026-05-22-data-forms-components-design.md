# Phase 8 — Data & Forms Components Design

**Date:** 2026-05-22
**Status:** Approved (brainstorming) — pending implementation plan
**Components:** `Textarea`, `Table`, `Progress`, `Pagination`

## 1. Context & Goals

`@koduhai/design-system` has shipped through Phase 7 (~25 components: form tier, overlays,
floating components). The original spec (`2026-05-21-custom-design-system-design.md`, §15)
scoped 12 styling-only components and has been fully exhausted and exceeded.

This phase fills the four highest-frequency real-world gaps that fit the system's
native-first, no-portal/no-focus-trap philosophy and require **no new infrastructure**:

- **Textarea** — the missing multiline sibling to `TextField`.
- **Table** — data-driven table with sorting, selection, loading/empty, sticky header.
- **Progress** — linear determinate + indeterminate bar (circular stays `Spinner`'s job).
- **Pagination** — numbered pages with ellipsis windowing.

All four reuse existing primitives, tokens, and conventions. Each is a self-contained folder
(`Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`, `index.ts`) following the
`Button` reference implementation. Exports go under a new `// Phase 8` block in `src/index.ts`.

## 2. Non-Goals (YAGNI)

- No virtualization / windowing in Table (consumers bring their own for huge datasets).
- No built-in data fetching, client-side filtering, or pagination wiring inside Table —
  Table emits sort/selection intent; the consumer owns comparators, data slicing, and paging.
- No circular Progress variant — `Spinner` already covers indeterminate circular.
- No compact prev/next-only Pagination variant — numbered+ellipsis only.
- No new Portal/FocusTrap infrastructure.

## 3. Component: Textarea

API parity with `TextField`, rendered on a `<textarea>`, so the two are interchangeable in
forms. Reuses `useId` + `useControllableState` and the identical label / helper / error / aria
wiring.

### Props

Extends `Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'value' | 'defaultValue' | 'onChange'>`.

| Prop           | Type                                                               | Notes                                                    |
| -------------- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| `label`        | `string`                                                           | Linked to the textarea via `htmlFor`/`id`.               |
| `value`        | `string`                                                           | Controlled value.                                        |
| `defaultValue` | `string`                                                           | Initial value when uncontrolled.                         |
| `onChange`     | `(value: string, event: ChangeEvent<HTMLTextAreaElement>) => void` | Fires on every keystroke.                                |
| `helperText`   | `ReactNode`                                                        | Hint below the field; hidden when an error shows.        |
| `error`        | `boolean`                                                          | Error state (`aria-invalid`).                            |
| `errorText`    | `ReactNode`                                                        | Replaces `helperText` when `error` is set.               |
| `size`         | `TextareaSize` (`'sm' \| 'md' \| 'lg'`)                            | Defaults to `'md'`.                                      |
| `required`     | `boolean`                                                          | Renders the `*` affordance and sets `required`.          |
| `autoResize`   | `boolean`                                                          | Grow height to content. Default `false`.                 |
| `rows`         | `number`                                                           | Initial rows (native), used when not auto-resizing.      |
| `minRows`      | `number`                                                           | Lower clamp for `autoResize`. Default `2`.               |
| `maxRows`      | `number`                                                           | Upper clamp for `autoResize` (scrolls beyond). Optional. |

### Behavior

- Controlled/uncontrolled symmetry via `useControllableState`, identical to `TextField`.
- `aria-describedby` points at the helper/error node; `aria-invalid` set on error.
- **Auto-resize**: in a layout effect keyed on the current value (and on input), set
  `el.style.height = 'auto'` then `el.style.height = clamp(scrollHeight, minRowsPx, maxRowsPx)`.
  Row heights derived from computed `line-height` + vertical padding. When `maxRows` is hit,
  `overflow-y: auto`. No height transition (respects `prefers-reduced-motion` regardless).
- `forwardRef` to the `<textarea>`; remaining DOM props spread onto it.

### A11y

Same guarantees as `TextField`: associated label, `aria-describedby`, `aria-invalid`,
visible focus ring. Color never the sole error signal (error text always rendered).

## 4. Component: Table (data-driven)

```tsx
<Table
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role', align: 'start' },
    { key: 'actions', header: '', render: (row) => <Menu .../>, width: '1%' },
  ]}
  data={users}
  getRowId={(u) => u.id}
  caption="Team members"
/>
```

Generic over the row type `Row` so `render` and `getRowId` are fully typed.

### Types

```ts
export type SortDirection = 'asc' | 'desc';
export type CellAlign = 'start' | 'center' | 'end';

export interface Column<Row> {
  /** Stable identity; also the default sort key. */
  key: string;
  /** Header cell content. Empty string allowed (e.g. an actions column). */
  header: ReactNode;
  /** Custom cell renderer. Defaults to `String(row[key])` when key indexes Row. */
  render?: (row: Row, rowIndex: number) => ReactNode;
  align?: CellAlign; // default 'start'
  width?: string; // any CSS width, applied to the column
  sortable?: boolean; // default false
}

export interface TableProps<Row> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Column<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;
  caption?: ReactNode; // visually-hidden accessible name by default
  captionVisible?: boolean; // render the caption visibly. default false

  // Sorting (controlled)
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;

  // Selection (controlled)
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // States
  loading?: boolean; // renders skeleton rows
  loadingRows?: number; // default 5
  empty?: ReactNode; // shown when data is empty and not loading

  // Layout
  stickyHeader?: boolean;
}
```

### Behavior

- **Semantics**: real `<table><thead><tbody>`; header cells are `<th scope="col">`, body cells
  `<td>`. `caption` rendered as `<caption>` (visually hidden via `VisuallyHidden` unless
  `captionVisible`). `data-align` on cells; `data-selected` on selected rows.
- **Sorting** (controlled, intent-only): a `sortable` column's header content is wrapped in a
  `<button>`. The `<th>` carries `aria-sort` (`'ascending'`/`'descending'`/`'none'`). Clicking a
  sortable header calls `onSortChange(key, nextDir)` where `nextDir` toggles `asc`→`desc` (and
  defaults to `asc` when switching columns). Table does **not** reorder `data` — the consumer
  sorts and passes sorted data back. Sort indicator is an icon **plus** `aria-sort` (color/icon
  never the sole signal).
- **Selection** (controlled): when `selectedIds`/`onSelectionChange` are provided, a leading
  column renders the existing `Checkbox`. Header checkbox = select-all: checked when all row ids
  selected, `indeterminate` when some. Toggling a row adds/removes its id; select-all toggles
  the full set of current `data` ids. Without the selection props, no checkbox column renders.
- **Loading**: `loading` renders `loadingRows` rows of `Skeleton` cells (one per column),
  composing the existing `Skeleton`. Header still renders.
- **Empty**: when `data.length === 0` and not `loading`, a single row spans all columns
  (`colSpan`) rendering `empty` (consumers typically pass `<EmptyState>`).
- **Sticky header**: `stickyHeader` applies `position: sticky; top: 0` to the header cells for
  scrolling within a constrained container.
- `forwardRef` to the `<table>`; remaining props spread onto it.

### A11y

- Native table semantics give row/column relationships for free.
- `aria-sort` communicates sort state; sort affordance is a labeled `<button>`.
- Select-all and per-row checkboxes are labeled (`aria-label`, e.g. "Select all rows" / row name).
- Accessible name via `<caption>`.
- Verified in both themes with zero axe violations, including a sortable + selectable story.

## 5. Component: Progress (linear)

```tsx
<Progress value={70} max={100} label="Uploading…" showValue />   // determinate
<Progress label="Loading" />                                     // indeterminate
```

### Props

Extends `Omit<HTMLAttributes<HTMLDivElement>, 'role'>`.

| Prop        | Type                                                                            | Notes                                                   |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `value`     | `number`                                                                        | Determinate progress. Omit/`undefined` ⇒ indeterminate. |
| `max`       | `number`                                                                        | Default `100`.                                          |
| `label`     | `string`                                                                        | Accessible name (and visible when `showValue`).         |
| `showValue` | `boolean`                                                                       | Render a visible `label` + percentage. Default `false`. |
| `size`      | `ProgressSize` (`'sm' \| 'md' \| 'lg'`)                                         | Track thickness. Default `'md'`.                        |
| `tone`      | `ProgressTone` (`'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger'`) | Bar color. Default `'primary'`.                         |

### Behavior

- Track element + fill element. Determinate: `width = clamp(value/max, 0, 1) * 100%`.
  Indeterminate: an animated sliding/looping bar (CSS keyframes).
- `prefers-reduced-motion`: indeterminate animation is disabled/replaced with a static subtle
  fill; determinate width transition removed.
- Tone bridged via a CSS-local custom property per convention (`--progress-fill`).

### A11y

- `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={max}`,
  `aria-valuenow={value}` (omitted entirely when indeterminate).
- Accessible name: visible label → `aria-labelledby`; otherwise `aria-label={label}`.

## 6. Component: Pagination (numbered + ellipsis)

```tsx
<Pagination
  count={20} // total pages
  page={6} // controlled current page (1-based)
  onPageChange={setPage}
  siblingCount={1} // pages shown either side of current
  boundaryCount={1} // pages shown at each end
/>
//  ‹  1 … 5 [6] 7 … 20  ›
```

### Props

Extends `Omit<HTMLAttributes<HTMLElement>, 'onChange'>` (root is `<nav>`).

| Prop            | Type                     | Notes                                     |
| --------------- | ------------------------ | ----------------------------------------- |
| `count`         | `number`                 | Total number of pages (≥ 1).              |
| `page`          | `number`                 | Controlled current page (1-based).        |
| `onPageChange`  | `(page: number) => void` | Fires with the requested page.            |
| `siblingCount`  | `number`                 | Pages around current. Default `1`.        |
| `boundaryCount` | `number`                 | Pages at each end. Default `1`.           |
| `disabled`      | `boolean`                | Disables all controls.                    |
| `aria-label`    | `string`                 | Nav landmark label. Default "Pagination". |

### Behavior

- **Range computation lives in a standalone, unit-tested helper** (`getPaginationRange`) that
  returns an ordered array of `number | 'ellipsis'` from `count`/`page`/`siblingCount`/
  `boundaryCount`. Edge cases covered by its own tests: `count === 1`, current near start, near
  end, ellipsis collapse (when a gap is only one page wide, render the page instead of `…`),
  small `count` where everything fits.
- Renders `<nav aria-label><ul>`. Each page is a `<li><button>`; current page button has
  `aria-current="page"` and `data-current`. Prev/Next buttons (`‹`/`›`) are labeled
  ("Previous page"/"Next page") and `disabled` at boundaries (page 1 / page `count`) or when
  `disabled`. Ellipses are inert `<li><span aria-hidden>…</span></li>`.
- Clicking a page button calls `onPageChange(n)`; prev/next call with `page - 1`/`page + 1`.
  Component is fully controlled — it does not hold page state.
- `forwardRef` to the `<nav>`; remaining props spread onto it.

### A11y

- `<nav>` landmark with an accessible label.
- `aria-current="page"` marks the active page (not color alone).
- Disabled boundary buttons are real `disabled` `<button>`s; icons have accessible labels.

## 7. Cross-Cutting Conventions

- **Folder/exports**: each component is `src/components/<Name>/` with the five standard files;
  every public prop type exported from its `index.ts` and re-exported from `src/index.ts` under
  a `// Phase 8 — data & forms` block.
- **Styling**: data-attribute selectors (`[data-size]`, `[data-align]`, `[data-selected]`,
  `[data-current]`, `[data-tone]`) + `--ku-*` tokens only; CSS-local custom properties bridge
  tone→variant. No runtime token imports. `prefers-reduced-motion` honored on all animation.
- **Composition**: Table composes `Checkbox`, `Skeleton`, and (via the `empty` slot) typically
  `EmptyState`. No component reads another's internals.
- **Controlled/uncontrolled**: Textarea is controllable (mirrors `TextField`). Table sorting and
  selection are controlled-only (intent emitters). Pagination is controlled-only.

## 8. Testing Strategy

All three layers must pass before merge (per repo conventions):

- **Vitest + Testing Library**:
  - Textarea: controlled/uncontrolled value, onChange contract, error/helper swap, auto-resize
    height adjusts on input (assert style.height changes; jsdom `scrollHeight` mocked).
  - Table: column render + custom `render`, sortable header emits `onSortChange` with toggled
    dir, `aria-sort` reflects props, selection add/remove + select-all/indeterminate, loading
    renders skeleton rows, empty slot renders when no data.
  - Progress: determinate width / aria-valuenow, indeterminate omits aria-valuenow, label wiring.
  - Pagination: `getPaginationRange` unit tests across edge cases; button clicks call
    `onPageChange`; prev/next disabled at boundaries; `aria-current` on active page.
- **`tsc --noEmit`** (strict): generics on Table type-check; DOM-prop collisions Omit-ted
  (`size`/`value`/`defaultValue`/`onChange` on Textarea, `role` on Progress, `onChange` on
  Pagination's nav, `children` on Table).
- **Playwright + axe** against Storybook stories in **both** dark and light themes, zero
  violations — including a sortable+selectable Table story, an indeterminate Progress story, and
  a mid-range Pagination story.

## 9. Build & Packaging

No pipeline changes. New CSS Modules are picked up by the existing tsup `local-css` loader; new
exports tree-shake under the existing `sideEffects` config. `build:tokens` unchanged.
