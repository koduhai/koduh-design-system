# DataTable — Design

**Date:** 2026-05-23
**Status:** Approved (brainstorming) — ready for implementation planning
**Component:** `@koduhai/design-system` → `DataTable`

## 1. Summary

`DataTable<Row>` is a **client-side, stateful orchestrator** built on top of the
existing presentational [`Table`](../../../src/components/Table/Table.tsx). The
spec for the design system (§2 Non-Goals) explicitly deferred `DataTable` as "a
large surface better delivered as a dedicated future effort"; this is that
effort.

`Table` renders columns/rows and emits controlled sort/selection callbacks but
performs no sorting, pagination, search, or cross-page selection. `DataTable`
owns that logic and composes `Table` + `Pagination` + the form controls
(`TextField`, `Select`, `Checkbox`) the library already ships. No new
third-party dependencies; zero-runtime CSS Modules; WCAG 2.1 AA.

## 2. Scope

**In scope (v1):**

- Client-side **sorting**: single + automatic **multi-column** (shift-click), type-aware.
- Client-side **pagination**: current page + page size (`[10, 25, 50]` default).
- **Row selection**: `select-all` targets **all matching rows across pages**; selection persists while paging/filtering.
- **Global search** across searchable columns.
- **Per-column filters**: `text` (contains), `select` (enum), `number-range`, `date-range` (native `<input type="date">`).
- Uncontrolled-by-default with controllable props for every interactive state, via `useControllableState` (library convention).
- Forwards `Table`'s `loading` / `empty` / `stickyHeader` / `caption`.

**Out of scope (v1):** server-side/manual data mode, column resizing/reordering,
column visibility toggles, virtualization, row expansion, a dedicated date
picker, a distinct "no results" message (reuses `empty`), CSV export.

## 3. Architecture

New folder `src/components/DataTable/` following the standard component layout:
`DataTable.tsx`, `DataTable.module.css`, `DataTable.test.tsx`,
`DataTable.stories.tsx`, `index.ts` — plus **`pipeline.ts`** and
`pipeline.test.ts` for the pure data logic.

**Layering:**

- `DataTable<Row>` is the only exported component. It composes:
  - `Table` — rendering (paged rows, sort indicators, selection checkboxes).
  - `Pagination` — page navigation.
  - `TextField` — global search; `text` and `number-range` filter inputs.
  - `Select` — `select`/enum filter control + page-size control.
  - native `<input type="date">` — `date-range` filter (no date picker exists yet).
- The pure pipeline (**filter → search → sort → paginate**) lives in `pipeline.ts`
  as standalone functions. An **internal** `useDataTable` hook memoizes them.
  Neither the hook nor the pipeline is exported — the public surface is
  `<DataTable>` and its types only.

**DOM layout (fixed):**

```
<div .root>
  <div .toolbar>   global search (left) · active-filter "Clear" + selection count (right)
  <div .filters>   per-column filter controls, each labeled by its column header
  <Table … paged rows, sort state, selection />
  <div .footer>    page-size <Select> · "1–10 of 53" (aria-live) · <Pagination />
</div>
```

Per-column filters live in the `.filters` region (labeled by column header),
**not** under each header cell: the architecture rule forbids reaching into
`Table`'s internal `<thead>` to inject a filter row.

### 3.1 Required change to `Table` (additive, non-breaking)

`Table`'s select-all currently targets only the rows it was handed (one page).
For "select-all = all matching rows," add an optional prop:

```ts
// TableProps<Row>
/** When provided, the header select-all checkbox reflects/toggles THIS id set
 *  (e.g. all rows across pages) instead of just the rendered `data`. */
selectAllIds?: string[];
```

When omitted, `Table` behaves exactly as today (backward compatible). `Table`'s
`allSelected` / `someSelected` / `toggleAll` compute against `selectAllIds ??
data.map(getRowId)`. `DataTable` passes the full filtered+searched id set.

## 4. Public API

```ts
type ColumnType = 'text' | 'number' | 'date';
type FilterKind = 'text' | 'select' | 'number-range' | 'date-range';

interface DataColumn<Row> extends Column<Row> {
  // key, header, render, align, width, sortable
  type?: ColumnType; // default 'text'; drives default compare + filter UI
  getValue?: (row: Row) => string | number | Date; // value for sort/filter/search; default row[key]
  compare?: (a: Row, b: Row) => number; // optional override; else type-aware default
  filter?: FilterKind; // opt-in per-column filter; omitted = not filterable
  filterOptions?: { label: string; value: string }[]; // for 'select'; auto-derived from data if omitted
  searchable?: boolean; // include in global search; default type === 'text'
}

type SortDirection = 'asc' | 'desc'; // reused from Table
interface SortRule {
  key: string;
  dir: SortDirection;
} // multi-sort = ordered array (priority order)

type FilterValue =
  | string // text
  | string[] // select (multi)
  | { min?: number; max?: number } // number-range
  | { from?: string; to?: string }; // date-range (ISO yyyy-mm-dd)
type FilterState = Record<string, FilterValue>; // keyed by column key

interface DataTableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: DataColumn<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;

  // sort (multi-sort always on; shift-click appends)
  sort?: SortRule[];
  defaultSort?: SortRule[];
  onSortChange?: (s: SortRule[]) => void;

  // pagination
  page?: number;
  defaultPage?: number;
  onPageChange?: (p: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (n: number) => void;
  pageSizeOptions?: number[]; // default [10, 25, 50]

  // selection (select-all = all matching rows across pages)
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // global search
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (q: string) => void;
  searchable?: boolean; // show the global search box; default true

  // per-column filters
  filters?: FilterState;
  defaultFilters?: FilterState;
  onFiltersChange?: (f: FilterState) => void;

  // forwarded to <Table>
  caption?: ReactNode;
  captionVisible?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingRows?: number;
  empty?: ReactNode;
  // className → root <div>; remaining DOM props spread to root
}
```

- Every public type (`DataColumn`, `ColumnType`, `FilterKind`, `FilterValue`,
  `FilterState`, `SortRule`, `DataTableProps`) is exported from
  `src/components/DataTable/index.ts` and re-exported from `src/index.ts`.
- `forwardRef` to the root `<div>`; the generic `<Row>` is preserved at the call
  site with the same cast pattern `Table` uses.
- All interactive state uses `useControllableState`: uncontrolled by default
  (seeded by `default*`), controllable via the `value`/`onChange` pair.
- Callbacks fire with the **next full state** so a controlled consumer can
  persist it (e.g. to the URL).

## 5. Data pipeline & behavior

Applied in `pipeline.ts` in this fixed order — each step a standalone, tested
pure function:

1. **Filter** — for each active per-column filter, test `getValue(row)`:
   - `text`: case-insensitive substring.
   - `select`: value ∈ chosen set.
   - `number-range`: `min ≤ v ≤ max` (open-ended when a bound is empty).
   - `date-range`: same on parsed dates.
   - Empty/invalid filter input is a no-op (skipped), never an error.
2. **Search** — case-insensitive substring of the query across `searchable`
   columns' stringified `getValue`.
3. **Sort** — **stable** sort applying `SortRule[]` in priority order; per column
   use `compare` if provided, else type-aware default (`number` numeric, `date`
   by timestamp, `text` `localeCompare`). Unsorted columns keep prior order.
4. **Paginate** — slice `[(page-1)*pageSize, page*pageSize]` of the sorted result.

**Sort interaction:** plain click sets the column as the sole sort rule, cycling
asc → desc → none. Shift-click appends/toggles it as an additional rule. When
more than one rule is active each sorted header shows a small priority badge
(1, 2, 3…) alongside the asc/desc icon.

**Selection:** `select-all` targets the full filtered+searched id set
(pre-pagination), supplied to `Table` via `selectAllIds`. Header checkbox is
`checked` when that set ⊆ selected, `indeterminate` when partial. Selected ids
for rows hidden by a later filter remain in state — `selectedIds` is the source
of truth.

**Edge cases:**

- **Page overflow:** if `page > pageCount` after filtering, the _displayed_ page
  is clamped to `[1, pageCount]`. Uncontrolled state updates internally;
  controlled state renders clamped without firing `onPageChange` unless a user
  action changes it (no surprise callbacks).
- **Empty vs no-match:** both render `Table`'s `empty` slot (distinct message is
  YAGNI for v1).
- **`loading`** forwards to `Table`'s skeleton; toolbar/footer stay mounted so
  layout doesn't jump.
- **`select` options** auto-derive as distinct `getValue` results when
  `filterOptions` is omitted.

**Accessibility:**

- Global search is a labeled `<TextField type="search">`.
- Each filter control is labeled by its column header.
- Page-size is a labeled `<Select>`.
- The row-range readout ("1–10 of 53") sits in an `aria-live="polite"` region so
  result-count changes are announced after filtering/searching.
- Sorting reuses `Table`'s existing per-column `aria-sort`; multiple sorted
  columns each carrying `aria-sort` is valid ARIA.
- Color is never the only signal; `prefers-reduced-motion` honored (inherited
  from the reset).

## 6. Testing

- **Unit (`pipeline.test.ts`):** every filter kind (incl. open-ended ranges and
  invalid-input no-ops), global search, single + multi-column sort across each
  `type` and a custom `compare`, sort stability, pagination math, page clamping.
- **Component (`DataTable.test.tsx`, Testing Library):** search narrows rows;
  each filter control updates rows + auto-derived `select` options; click cycles
  asc→desc→none; shift-click builds multi-sort with priority badges; pagination
  next/prev + page-size change; select-all targets all matching rows and persists
  across pages/filters; controlled⇄uncontrolled symmetry for every state pair;
  loading + empty.
- **a11y (Playwright + axe, both themes):** stories for default, filtered,
  multi-sorted, selected, loading, empty — zero violations.
- **Visual:** `*-chromium-linux.png` baselines generated on the hosted runner via
  the `update-baselines` workflow.

## 7. Files

```
src/components/DataTable/
  DataTable.tsx          # component: state (useControllableState) + composition
  DataTable.module.css   # toolbar/filters/footer layout, priority badge
  pipeline.ts            # pure filter/search/sort/paginate functions
  pipeline.test.ts       # unit tests for the pipeline
  DataTable.test.tsx     # component/behavior tests
  DataTable.stories.tsx  # Storybook stories (drive axe + visual)
  index.ts               # exports component + public types
src/components/Table/Table.tsx   # add optional `selectAllIds` prop (additive)
src/index.ts                     # re-export DataTable + its types
```
