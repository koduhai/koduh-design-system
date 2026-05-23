# DataTable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side `DataTable<Row>` that wraps the existing `Table` with sorting (single + multi-column), pagination, all-matching-rows selection, global search, and per-column filters (text / multi-select enum / number-range / date-range).

**Architecture:** A pure data pipeline (`filter → search → sort → paginate`) in `pipeline.ts` does the work and is unit-tested in isolation. `DataTable.tsx` holds state via `useControllableState` (uncontrolled by default, fully controllable) and composes `Table` + `Pagination` + `TextField` + `Select` + (`Popover` + `Checkbox` for the multi-select filter). `Table` gets three backward-compatible additions: multi-sort rendering, sort-event forwarding, and `selectAllIds`.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules (zero-runtime), Vitest + Testing Library, Playwright + axe. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-05-23-datatable-design.md`

---

## File Structure

| File                                                      | Responsibility                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Table/Table.tsx` (modify)                 | Add `SortRule`, `sort?: SortRule[]`, `selectAllIds?`, event-forwarding `onSortChange`, priority badges. Backward compatible.        |
| `src/components/Table/Table.module.css` (modify)          | `.sortPriority` badge style.                                                                                                        |
| `src/components/Table/index.ts` (modify)                  | Export `SortRule`.                                                                                                                  |
| `src/components/Table/Table.test.tsx` (modify)            | Cover the three additions.                                                                                                          |
| `src/components/DataTable/types.ts` (create)              | Public types: `ColumnType`, `FilterKind`, `FilterValue`, `FilterState`, `DataColumn`, `DataTableProps`.                             |
| `src/components/DataTable/pipeline.ts` (create)           | Pure `getColumnValue`, `applyColumnFilters`, `applyGlobalSearch`, `applySort`, `paginate`, `pageCount`, `clampPage`, `runPipeline`. |
| `src/components/DataTable/pipeline.test.ts` (create)      | Unit tests for the pipeline.                                                                                                        |
| `src/components/DataTable/DataTable.tsx` (create)         | Stateful component composing everything.                                                                                            |
| `src/components/DataTable/DataTable.module.css` (create)  | Toolbar / filters / footer layout.                                                                                                  |
| `src/components/DataTable/DataTable.test.tsx` (create)    | Component/behavior tests.                                                                                                           |
| `src/components/DataTable/DataTable.stories.tsx` (create) | Stories for axe + visual.                                                                                                           |
| `src/components/DataTable/index.ts` (create)              | Export component + public types.                                                                                                    |
| `src/index.ts` (modify)                                   | Re-export `DataTable` + types.                                                                                                      |
| `e2e/components.spec.ts` (modify)                         | Register DataTable stories for a11y + visual.                                                                                       |

Conventions to follow (from `CLAUDE.md` and the `Table` reference): data-attribute styling, `cx(styles.root, className)`, `forwardRef` + spread DOM props, controlled/uncontrolled via `useControllableState`, `as CSSProperties` for any `--ku-*` inline vars, guard `noUncheckedIndexedAccess` array access, export every public type from `index.ts` and re-export from `src/index.ts`.

---

## Task 1: Extend `Table` for multi-sort, event forwarding, and `selectAllIds`

**Files:**

- Modify: `src/components/Table/Table.tsx`
- Modify: `src/components/Table/Table.module.css`
- Modify: `src/components/Table/index.ts`
- Test: `src/components/Table/Table.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/Table/Table.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from './Table';
import type { Column, SortRule } from './Table';

interface Row {
  id: string;
  name: string;
  age: number;
}
const rows: Row[] = [
  { id: '1', name: 'Ann', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];
const cols: Column<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
];

test('renders an aria-sort and priority badge for each rule in multi-sort', () => {
  const sort: SortRule[] = [
    { key: 'name', dir: 'asc' },
    { key: 'age', dir: 'desc' },
  ];
  render(
    <Table columns={cols} data={rows} getRowId={(r) => r.id} sort={sort} onSortChange={() => {}} />,
  );
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  // priority badges 1 and 2 are shown when more than one rule is active
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('onSortChange forwards the originating mouse event (for shift detection)', async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(
    <Table
      columns={cols}
      data={rows}
      getRowId={(r) => r.id}
      sort={[]}
      onSortChange={onSortChange}
    />,
  );
  await user.keyboard('{Shift>}');
  await user.click(screen.getByRole('button', { name: /Name/ }));
  await user.keyboard('{/Shift}');
  expect(onSortChange).toHaveBeenCalledWith(
    'name',
    expect.any(String),
    expect.objectContaining({ shiftKey: true }),
  );
});

test('selectAllIds targets that id set instead of the rendered page', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <Table
      columns={cols}
      data={rows}
      getRowId={(r) => r.id}
      selectedIds={[]}
      onSelectionChange={onSelectionChange}
      selectAllIds={['1', '2', '3']}
    />,
  );
  await user.click(screen.getByRole('checkbox', { name: /select all/i }));
  expect(onSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/components/Table/Table.test.tsx`
Expected: FAIL — `SortRule` not exported; `sort`/`selectAllIds` props don't exist; event not forwarded.

- [ ] **Step 3: Implement the additions in `Table.tsx`**

Add the `SortRule` type after `SortDirection`:

```tsx
export type SortDirection = 'asc' | 'desc';
export interface SortRule {
  key: string;
  dir: SortDirection;
}
```

Add to `TableProps<Row>` (next to the existing sort/selection props):

```tsx
  /**
   * Multi-column sort rules in priority order. When provided, takes precedence
   * over `sortKey`/`sortDir` and renders an `aria-sort` + priority badge per
   * sorted column. Omit to keep the single-column `sortKey`/`sortDir` behavior.
   */
  sort?: SortRule[];
  /**
   * When provided, the header select-all checkbox reflects/toggles THIS id set
   * (e.g. all rows across pages) instead of only the rendered `data`.
   */
  selectAllIds?: string[];
```

Change the `onSortChange` signature to forward the event:

```tsx
  /** Fires with the requested sort key, toggled direction, and the originating event. */
  onSortChange?: (key: string, dir: SortDirection, event?: React.MouseEvent) => void;
```

Destructure `sort` and `selectAllIds` in the params. Replace the sort-state derivation and selection math:

```tsx
// Effective sort rules: explicit multi-sort wins; else derive from single sortKey/sortDir.
const rules: SortRule[] = sort ?? (sortKey ? [{ key: sortKey, dir: sortDir ?? 'asc' }] : []);
const ruleIndex = new Map(rules.map((r, i) => [r.key, i] as const));
const ruleFor = (key: string) => {
  const i = ruleIndex.get(key);
  return i === undefined ? undefined : { rule: rules[i]!, index: i };
};

const selectAllTarget = selectAllIds ?? data.map(getRowId);
const selectedSet = new Set(selectedIds ?? []);
const allIds = data.map(getRowId);
const allSelected =
  selectable && selectAllTarget.length > 0 && selectAllTarget.every((id) => selectedSet.has(id));
const someSelected =
  selectable && selectAllTarget.some((id) => selectedSet.has(id)) && !allSelected;
```

Update `toggleAll` to use `selectAllTarget`:

```tsx
const toggleAll = () => {
  onSelectionChange?.(allSelected ? [] : selectAllTarget);
};
```

Update `handleSort` to accept and forward the event:

```tsx
const handleSort = (col: Column<Row>, event: React.MouseEvent) => {
  if (!col.sortable || !onSortChange) return;
  const found = ruleFor(col.key);
  const nextDir: SortDirection = found?.rule.dir === 'asc' ? 'desc' : 'asc';
  onSortChange(col.key, nextDir, event);
};
```

Update `ariaSort` to read the rule map:

```tsx
const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
  if (!col.sortable) return undefined;
  const found = ruleFor(col.key);
  if (!found) return 'none';
  return found.rule.dir === 'desc' ? 'descending' : 'ascending';
};
```

In the header `<th>` sort button, pass the event and render the priority badge. Replace the sort `<button>` block:

```tsx
{
  col.sortable ? (
    <button
      type="button"
      className={styles.sortButton}
      onClick={(event) => handleSort(col, event)}
      data-active={ruleFor(col.key) ? 'true' : undefined}
    >
      {col.header}
      {rules.length > 1 && ruleFor(col.key) ? (
        <span className={styles.sortPriority} aria-hidden="true">
          {ruleFor(col.key)!.index + 1}
        </span>
      ) : null}
      <span className={styles.sortIcon} aria-hidden="true" data-dir={ruleFor(col.key)?.rule.dir} />
    </button>
  ) : (
    col.header
  );
}
```

- [ ] **Step 4: Add the badge style to `Table.module.css`**

```css
.sortPriority {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25em;
  height: 1.25em;
  margin-inline-start: var(--ku-space-1);
  padding-inline: 0.25em;
  border-radius: var(--ku-radius-full);
  background: var(--ku-color-bg-muted);
  color: var(--ku-color-text-secondary);
  font-size: var(--ku-font-size-xs);
  line-height: 1;
}
```

- [ ] **Step 5: Export `SortRule` from `src/components/Table/index.ts`**

```ts
export { Table } from './Table';
export type { TableProps, Column, SortDirection, SortRule, CellAlign } from './Table';
```

- [ ] **Step 6: Run the full Table test file**

Run: `npx vitest run src/components/Table/Table.test.tsx`
Expected: PASS (new + all existing tests, confirming backward compatibility).

- [ ] **Step 7: Commit**

```bash
git add src/components/Table
git commit -m "feat(Table): multi-sort rendering, sort-event forwarding, selectAllIds"
```

---

## Task 2: DataTable public types

**Files:**

- Create: `src/components/DataTable/types.ts`

- [ ] **Step 1: Write the types**

```ts
import type { HTMLAttributes, ReactNode } from 'react';
import type { Column, SortRule, SortDirection } from '../Table';

export type { SortRule, SortDirection };

export type ColumnType = 'text' | 'number' | 'date';
export type FilterKind = 'text' | 'select' | 'number-range' | 'date-range';

/** Per-filter value shapes, discriminated by their keys at runtime. */
export type FilterValue =
  | string // text
  | string[] // select (multi)
  | { min?: number; max?: number } // number-range
  | { from?: string; to?: string }; // date-range (ISO yyyy-mm-dd)

export type FilterState = Record<string, FilterValue>;

export interface DataColumn<Row> extends Column<Row> {
  /** Drives the default comparator and the filter control. Default 'text'. */
  type?: ColumnType;
  /** Value used for sort/filter/search. Defaults to `row[key]`. */
  getValue?: (row: Row) => string | number | Date;
  /** Optional comparator override; otherwise a type-aware default is used. */
  compare?: (a: Row, b: Row) => number;
  /** Opt-in per-column filter control. Omit for a non-filterable column. */
  filter?: FilterKind;
  /** Options for a `select` filter. Auto-derived from data when omitted. */
  filterOptions?: { label: string; value: string }[];
  /** Include this column in global search. Defaults to `type === 'text'`. */
  searchable?: boolean;
}

export interface DataTableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: DataColumn<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;

  sort?: SortRule[];
  defaultSort?: SortRule[];
  onSortChange?: (sort: SortRule[]) => void;

  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];

  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  search?: string;
  defaultSearch?: string;
  onSearchChange?: (query: string) => void;
  searchable?: boolean;

  filters?: FilterState;
  defaultFilters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;

  caption?: ReactNode;
  captionVisible?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingRows?: number;
  empty?: ReactNode;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS (no usages yet; just confirms imports resolve).

- [ ] **Step 3: Commit**

```bash
git add src/components/DataTable/types.ts
git commit -m "feat(DataTable): public types"
```

---

## Task 3: Pipeline — value resolution and sorting

**Files:**

- Create: `src/components/DataTable/pipeline.ts`
- Test: `src/components/DataTable/pipeline.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { getColumnValue, applySort } from './pipeline';
import type { DataColumn } from './types';

interface Row {
  id: string;
  name: string;
  age: number;
  joined: string;
}
const data: Row[] = [
  { id: '1', name: 'Bob', age: 30, joined: '2021-06-01' },
  { id: '2', name: 'ann', age: 30, joined: '2020-01-15' },
  { id: '3', name: 'Cy', age: 25, joined: '2022-03-30' },
];
const columns: DataColumn<Row>[] = [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'age', header: 'Age', type: 'number' },
  { key: 'joined', header: 'Joined', type: 'date' },
];

test('getColumnValue defaults to row[key] and honors getValue', () => {
  expect(getColumnValue(columns[0]!, data[0]!)).toBe('Bob');
  const custom: DataColumn<Row> = { key: 'x', header: 'X', getValue: (r) => r.age * 2 };
  expect(getColumnValue(custom, data[0]!)).toBe(60);
});

test('applySort sorts text case-insensitively (locale compare)', () => {
  const out = applySort(data, [{ key: 'name', dir: 'asc' }], columns);
  expect(out.map((r) => r.name)).toEqual(['ann', 'Bob', 'Cy']);
});

test('applySort sorts numbers numerically and respects direction', () => {
  const out = applySort(data, [{ key: 'age', dir: 'desc' }], columns);
  expect(out.map((r) => r.age)).toEqual([30, 30, 25]);
});

test('applySort sorts dates chronologically', () => {
  const out = applySort(data, [{ key: 'joined', dir: 'asc' }], columns);
  expect(out.map((r) => r.id)).toEqual(['2', '1', '3']);
});

test('multi-sort applies rules in priority order and is stable', () => {
  // age asc, then name asc; the two age=30 rows keep name order ann < Bob
  const out = applySort(
    data,
    [
      { key: 'age', dir: 'asc' },
      { key: 'name', dir: 'asc' },
    ],
    columns,
  );
  expect(out.map((r) => r.id)).toEqual(['3', '2', '1']);
});

test('empty sort returns input order (new array, not mutated)', () => {
  const out = applySort(data, [], columns);
  expect(out).toEqual(data);
  expect(out).not.toBe(data);
});

test('custom compare overrides the default', () => {
  const cols: DataColumn<Row>[] = [
    { key: 'name', header: 'Name', compare: (a, b) => a.id.localeCompare(b.id) },
  ];
  const out = applySort(data, [{ key: 'name', dir: 'desc' }], cols);
  expect(out.map((r) => r.id)).toEqual(['3', '2', '1']);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts`
Expected: FAIL — module/functions not defined.

- [ ] **Step 3: Implement value resolution + sort in `pipeline.ts`**

```ts
import type { ColumnType, DataColumn, SortRule } from './types';

export function getColumnValue<Row>(col: DataColumn<Row>, row: Row): string | number | Date {
  if (col.getValue) return col.getValue(row);
  return (row as Record<string, unknown>)[col.key] as string | number | Date;
}

function toComparable(value: string | number | Date, type: ColumnType): number | string {
  if (type === 'number') return typeof value === 'number' ? value : Number(value);
  if (type === 'date') return value instanceof Date ? value.getTime() : new Date(value).getTime();
  return String(value);
}

function defaultCompare(
  a: string | number | Date,
  b: string | number | Date,
  type: ColumnType,
): number {
  if (type === 'text') return String(a).localeCompare(String(b));
  const av = toComparable(a, type);
  const bv = toComparable(b, type);
  return av < bv ? -1 : av > bv ? 1 : 0;
}

export function applySort<Row>(rows: Row[], sort: SortRule[], columns: DataColumn<Row>[]): Row[] {
  if (sort.length === 0) return rows.slice();
  const byKey = new Map(columns.map((c) => [c.key, c] as const));
  // Array.prototype.sort is stable (ES2019+), so equal rows keep input order.
  return rows.slice().sort((a, b) => {
    for (const rule of sort) {
      const col = byKey.get(rule.key);
      if (!col) continue;
      let cmp = col.compare
        ? col.compare(a, b)
        : defaultCompare(getColumnValue(col, a), getColumnValue(col, b), col.type ?? 'text');
      if (rule.dir === 'desc') cmp = -cmp;
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/DataTable/pipeline.ts src/components/DataTable/pipeline.test.ts
git commit -m "feat(DataTable): pipeline value resolution + type-aware multi-sort"
```

---

## Task 4: Pipeline — per-column filters

**Files:**

- Modify: `src/components/DataTable/pipeline.ts`
- Test: `src/components/DataTable/pipeline.test.ts`

- [ ] **Step 1: Write failing tests** (append)

```ts
import { applyColumnFilters } from './pipeline';
import type { FilterState } from './types';

test('text filter is a case-insensitive substring match', () => {
  const filters: FilterState = { name: 'b' };
  expect(applyColumnFilters(data, filters, columns).map((r) => r.id)).toEqual(['1']); // 'Bob'
});

test('select filter matches any chosen value; empty array is a no-op', () => {
  const filters: FilterState = { name: ['Bob', 'Cy'] };
  expect(applyColumnFilters(data, filters, columns).map((r) => r.id)).toEqual(['1', '3']);
  expect(applyColumnFilters(data, { name: [] }, columns)).toHaveLength(3);
});

test('number-range filter respects open-ended bounds', () => {
  expect(applyColumnFilters(data, { age: { min: 26 } }, columns).map((r) => r.id)).toEqual([
    '1',
    '2',
  ]);
  expect(applyColumnFilters(data, { age: { max: 25 } }, columns).map((r) => r.id)).toEqual(['3']);
  expect(applyColumnFilters(data, { age: {} }, columns)).toHaveLength(3); // no-op
});

test('date-range filter respects open-ended bounds', () => {
  expect(
    applyColumnFilters(data, { joined: { from: '2021-01-01' } }, columns).map((r) => r.id),
  ).toEqual(['1', '3']);
  expect(
    applyColumnFilters(data, { joined: { to: '2020-12-31' } }, columns).map((r) => r.id),
  ).toEqual(['2']);
});

test('an empty text filter is a no-op', () => {
  expect(applyColumnFilters(data, { name: '' }, columns)).toHaveLength(3);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts -t filter`
Expected: FAIL — `applyColumnFilters` not defined.

- [ ] **Step 3: Implement `applyColumnFilters`** (append to `pipeline.ts`)

```ts
import type { FilterState, FilterValue } from './types';

function matches(value: string | number | Date, filter: FilterValue, type: ColumnType): boolean {
  if (typeof filter === 'string') {
    if (filter === '') return true;
    return String(value).toLowerCase().includes(filter.toLowerCase());
  }
  if (Array.isArray(filter)) {
    if (filter.length === 0) return true;
    return filter.includes(String(value));
  }
  if ('min' in filter || 'max' in filter) {
    const n = type === 'number' ? Number(value) : Number(value);
    if (filter.min != null && n < filter.min) return false;
    if (filter.max != null && n > filter.max) return false;
    return true;
  }
  if ('from' in filter || 'to' in filter) {
    const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (filter.from && t < new Date(filter.from).getTime()) return false;
    if (filter.to && t > new Date(filter.to).getTime()) return false;
    return true;
  }
  return true; // empty object {} — no-op
}

export function applyColumnFilters<Row>(
  rows: Row[],
  filters: FilterState,
  columns: DataColumn<Row>[],
): Row[] {
  const active = columns.filter((c) => c.filter && filters[c.key] !== undefined);
  if (active.length === 0) return rows.slice();
  return rows.filter((row) =>
    active.every((col) => matches(getColumnValue(col, row), filters[col.key]!, col.type ?? 'text')),
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/DataTable/pipeline.ts src/components/DataTable/pipeline.test.ts
git commit -m "feat(DataTable): per-column filters (text/select/number-range/date-range)"
```

---

## Task 5: Pipeline — global search, pagination, and `runPipeline`

**Files:**

- Modify: `src/components/DataTable/pipeline.ts`
- Test: `src/components/DataTable/pipeline.test.ts`

- [ ] **Step 1: Write failing tests** (append)

```ts
import { applyGlobalSearch, paginate, pageCount, clampPage, runPipeline } from './pipeline';

test('global search matches across searchable columns, case-insensitive', () => {
  // name is text → searchable by default; age/joined are not text → excluded
  expect(applyGlobalSearch(data, 'an', columns).map((r) => r.id)).toEqual(['2']); // 'ann'
  expect(applyGlobalSearch(data, '', columns)).toHaveLength(3); // empty query no-op
});

test('searchable override includes a non-text column', () => {
  const cols: DataColumn<Row>[] = [{ key: 'age', header: 'Age', type: 'number', searchable: true }];
  expect(applyGlobalSearch(data, '25', cols).map((r) => r.id)).toEqual(['3']);
});

test('paginate slices the current page (1-based)', () => {
  expect(paginate(data, 1, 2).map((r) => r.id)).toEqual(['1', '2']);
  expect(paginate(data, 2, 2).map((r) => r.id)).toEqual(['3']);
});

test('pageCount is at least 1', () => {
  expect(pageCount(0, 10)).toBe(1);
  expect(pageCount(21, 10)).toBe(3);
});

test('clampPage keeps the page within [1, pageCount]', () => {
  expect(clampPage(5, 21, 10)).toBe(3);
  expect(clampPage(0, 21, 10)).toBe(1);
});

test('runPipeline composes filter → search → sort → paginate and reports matching ids', () => {
  const result = runPipeline({
    data,
    columns,
    getRowId: (r) => r.id,
    filters: { age: { min: 26 } }, // keeps Bob(1) + ann(2)
    search: '',
    sort: [{ key: 'name', dir: 'asc' }], // ann, Bob
    page: 1,
    pageSize: 1,
  });
  expect(result.total).toBe(2);
  expect(result.matchingIds).toEqual(['2', '1']);
  expect(result.rows.map((r) => r.id)).toEqual(['2']); // page 1, size 1
  expect(result.page).toBe(1);
});

test('runPipeline clamps an out-of-range page', () => {
  const result = runPipeline({
    data,
    columns,
    getRowId: (r) => r.id,
    filters: {},
    search: '',
    sort: [],
    page: 99,
    pageSize: 2,
  });
  expect(result.page).toBe(2); // 3 rows / 2 per page = 2 pages
  expect(result.rows.map((r) => r.id)).toEqual(['3']);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts -t search`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement** (append to `pipeline.ts`)

```ts
export function applyGlobalSearch<Row>(
  rows: Row[],
  query: string,
  columns: DataColumn<Row>[],
): Row[] {
  const q = query.trim().toLowerCase();
  if (q === '') return rows.slice();
  const searchable = columns.filter((c) => c.searchable ?? (c.type ?? 'text') === 'text');
  if (searchable.length === 0) return rows.slice();
  return rows.filter((row) =>
    searchable.some((col) => String(getColumnValue(col, row)).toLowerCase().includes(q)),
  );
}

export function paginate<Row>(rows: Row[], page: number, pageSize: number): Row[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

export interface PipelineInput<Row> {
  data: Row[];
  columns: DataColumn<Row>[];
  getRowId: (row: Row) => string;
  filters: FilterState;
  search: string;
  sort: SortRule[];
  page: number;
  pageSize: number;
}

export interface PipelineResult<Row> {
  rows: Row[];
  matchingIds: string[];
  total: number;
  page: number;
}

export function runPipeline<Row>(input: PipelineInput<Row>): PipelineResult<Row> {
  const { data, columns, getRowId, filters, search, sort, page, pageSize } = input;
  const filtered = applyColumnFilters(data, filters, columns);
  const searched = applyGlobalSearch(filtered, search, columns);
  const sorted = applySort(searched, sort, columns);
  const total = sorted.length;
  const safePage = clampPage(page, total, pageSize);
  return {
    rows: paginate(sorted, safePage, pageSize),
    matchingIds: sorted.map(getRowId),
    total,
    page: safePage,
  };
}
```

- [ ] **Step 4: Run the whole pipeline file, verify pass**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts`
Expected: PASS (all pipeline tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/DataTable/pipeline.ts src/components/DataTable/pipeline.test.ts
git commit -m "feat(DataTable): global search, pagination, runPipeline orchestrator"
```

---

## Task 6: DataTable scaffold — render rows through `Table`

**Files:**

- Create: `src/components/DataTable/DataTable.tsx`
- Create: `src/components/DataTable/DataTable.module.css`
- Create: `src/components/DataTable/index.ts`
- Test: `src/components/DataTable/DataTable.test.tsx`

This task wires state (all uncontrolled defaults), runs the pipeline, and renders `Table` with the paged rows. Sorting/pagination/search/filter UI come in later tasks.

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';
import type { DataColumn } from './types';

interface Row {
  id: string;
  name: string;
  age: number;
}
const data: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  age: 20 + i,
}));
const columns: DataColumn<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age', type: 'number' },
];

test('renders only the first page of rows (default pageSize 10)', () => {
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />);
  expect(screen.getByText('User 1')).toBeInTheDocument();
  expect(screen.getByText('User 10')).toBeInTheDocument();
  expect(screen.queryByText('User 11')).not.toBeInTheDocument();
});

test('renders the empty slot when data is empty', () => {
  render(
    <DataTable
      columns={columns}
      data={[]}
      getRowId={(r) => r.id}
      empty={<span>Nothing here</span>}
    />,
  );
  expect(screen.getByText('Nothing here')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the scaffold in `DataTable.tsx`**

```tsx
import { forwardRef } from 'react';
import type { ForwardedRef, Ref } from 'react';
import { Table } from '../Table';
import type { Column } from '../Table';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { runPipeline } from './pipeline';
import type { DataColumn, DataTableProps, FilterState, SortRule } from './types';
import styles from './DataTable.module.css';

function DataTableInner<Row>(
  {
    columns,
    data,
    getRowId,
    sort,
    defaultSort = [],
    onSortChange,
    page,
    defaultPage = 1,
    onPageChange,
    pageSize,
    defaultPageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    selectedIds,
    defaultSelectedIds = [],
    onSelectionChange,
    search,
    defaultSearch = '',
    onSearchChange,
    searchable = true,
    filters,
    defaultFilters = {},
    onFiltersChange,
    caption,
    captionVisible,
    stickyHeader,
    loading,
    loadingRows,
    empty,
    className,
    ...props
  }: DataTableProps<Row>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [sortState, setSort] = useControllableState<SortRule[]>({
    value: sort,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [pageState, setPage] = useControllableState<number>({
    value: page,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [pageSizeState, setPageSize] = useControllableState<number>({
    value: pageSize,
    defaultValue: defaultPageSize ?? pageSizeOptions[0] ?? 10,
    onChange: onPageSizeChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedIds,
    defaultValue: defaultSelectedIds,
    onChange: onSelectionChange,
  });
  const [searchState, setSearch] = useControllableState<string>({
    value: search,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
  });
  const [filterState, setFilters] = useControllableState<FilterState>({
    value: filters,
    defaultValue: defaultFilters,
    onChange: onFiltersChange,
  });

  const {
    rows,
    matchingIds,
    total,
    page: safePage,
  } = runPipeline({
    data,
    columns,
    getRowId,
    filters: filterState,
    search: searchState,
    sort: sortState,
    page: pageState,
    pageSize: pageSizeState,
  });

  // DataColumn carries extra fields; Table only needs the base Column shape.
  const tableColumns = columns as Column<Row>[];

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      <Table
        columns={tableColumns}
        data={rows}
        getRowId={getRowId}
        caption={caption}
        captionVisible={captionVisible}
        stickyHeader={stickyHeader}
        loading={loading}
        loadingRows={loadingRows}
        empty={empty}
        sort={sortState}
        selectedIds={selected}
        selectAllIds={matchingIds}
      />
    </div>
  );
}

export const DataTable = /* @__PURE__ */ forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;
```

> Note: later tasks add the toolbar/filters/footer markup and the `onSortChange`,
> `onSelectionChange`, search, page, and filter handlers. `total`/`setSort`/
> `setPage`/`setPageSize`/`setSelected`/`setSearch`/`setFilters` are intentionally
> unused until then — to keep this step typechecking, temporarily prefix the
> unused setters with `void` (e.g. `void setSort;`) at the end of the function,
> and remove each `void` as the corresponding task wires it up.

- [ ] **Step 4: Create `DataTable.module.css`** (minimal; expanded later)

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-3);
}
```

- [ ] **Step 5: Create `src/components/DataTable/index.ts`**

```ts
export { DataTable } from './DataTable';
export type {
  DataTableProps,
  DataColumn,
  ColumnType,
  FilterKind,
  FilterValue,
  FilterState,
  SortRule,
  SortDirection,
} from './types';
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): scaffold rendering paged rows through Table"
```

---

## Task 7: Sorting interaction (single + shift-click multi-sort)

**Files:**

- Modify: `src/components/DataTable/DataTable.tsx`
- Modify: `src/components/DataTable/pipeline.ts` (add `cycleSort` helper)
- Test: `src/components/DataTable/pipeline.test.ts`, `src/components/DataTable/DataTable.test.tsx`

- [ ] **Step 1: Write failing tests for `cycleSort`** (append to `pipeline.test.ts`)

```ts
import { cycleSort } from './pipeline';

test('single-sort click cycles asc → desc → none', () => {
  expect(cycleSort([], 'name', false)).toEqual([{ key: 'name', dir: 'asc' }]);
  expect(cycleSort([{ key: 'name', dir: 'asc' }], 'name', false)).toEqual([
    { key: 'name', dir: 'desc' },
  ]);
  expect(cycleSort([{ key: 'name', dir: 'desc' }], 'name', false)).toEqual([]);
});

test('single-sort click on a new column replaces the rules', () => {
  expect(cycleSort([{ key: 'age', dir: 'asc' }], 'name', false)).toEqual([
    { key: 'name', dir: 'asc' },
  ]);
});

test('shift-click appends, toggles, then removes a rule without touching others', () => {
  const a = cycleSort([{ key: 'age', dir: 'asc' }], 'name', true);
  expect(a).toEqual([
    { key: 'age', dir: 'asc' },
    { key: 'name', dir: 'asc' },
  ]);
  const b = cycleSort(a, 'name', true);
  expect(b).toEqual([
    { key: 'age', dir: 'asc' },
    { key: 'name', dir: 'desc' },
  ]);
  const c = cycleSort(b, 'name', true);
  expect(c).toEqual([{ key: 'age', dir: 'asc' }]);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts -t cycleSort`
Expected: FAIL — `cycleSort` not defined.

- [ ] **Step 3: Implement `cycleSort`** (append to `pipeline.ts`)

```ts
/** Next sort rules after clicking `key`. `additive` = shift-click (multi-sort). */
export function cycleSort(current: SortRule[], key: string, additive: boolean): SortRule[] {
  const existing = current.find((r) => r.key === key);
  if (additive) {
    if (!existing) return [...current, { key, dir: 'asc' }];
    if (existing.dir === 'asc')
      return current.map((r) => (r.key === key ? { key, dir: 'desc' } : r));
    return current.filter((r) => r.key !== key); // desc → remove
  }
  // single-sort: operate only on this key, discarding other rules
  if (!existing || existing.key !== key) return [{ key, dir: 'asc' }];
  if (existing.dir === 'asc') return [{ key, dir: 'desc' }];
  return []; // desc → none
}
```

> The `!existing || existing.key !== key` guard collapses to "no rule for this
> key" — when another column was sorted, clicking starts this column fresh at asc.

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/components/DataTable/pipeline.test.ts -t cycleSort`
Expected: PASS.

- [ ] **Step 5: Write failing component test** (append to `DataTable.test.tsx`)

```tsx
import userEvent from '@testing-library/user-event';

test('clicking a sortable header sorts ascending then descending', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'age', header: 'Age', type: 'number', sortable: true },
      ]}
      data={data}
      getRowId={(r) => r.id}
      defaultPageSize={25}
    />,
  );
  const ageHeader = screen.getByRole('button', { name: /Age/ });
  await user.click(ageHeader);
  const firstRowAfterAsc = screen.getAllByRole('row')[1]!;
  expect(within(firstRowAfterAsc).getByText('20')).toBeInTheDocument(); // youngest first
  await user.click(ageHeader);
  const firstRowAfterDesc = screen.getAllByRole('row')[1]!;
  expect(within(firstRowAfterDesc).getByText('31')).toBeInTheDocument(); // oldest first
});

test('shift-click builds multi-sort (priority badges shown)', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'age', header: 'Age', type: 'number', sortable: true },
      ]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  await user.click(screen.getByRole('button', { name: /Name/ }));
  await user.keyboard('{Shift>}');
  await user.click(screen.getByRole('button', { name: /Age/ }));
  await user.keyboard('{/Shift}');
  expect(screen.getByText('1')).toBeInTheDocument(); // priority badge for Name
  expect(screen.getByText('2')).toBeInTheDocument(); // priority badge for Age
});
```

Add `import { within } from '@testing-library/react';` to the test file imports.

- [ ] **Step 6: Wire the sort handler in `DataTable.tsx`**

Add the import:

```tsx
import { runPipeline, cycleSort } from './pipeline';
```

Add the handler (before the `return`) and remove `void setSort;`:

```tsx
const handleSortChange = (key: string, _dir: SortRule['dir'], event?: React.MouseEvent) => {
  setSort(cycleSort(sortState, key, event?.shiftKey ?? false));
};
```

Pass it to `Table`:

```tsx
sort = { sortState };
onSortChange = { handleSortChange };
```

- [ ] **Step 7: Run tests + typecheck, verify pass**

Run: `npx vitest run src/components/DataTable && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): single + shift-click multi-column sort"
```

---

## Task 8: Pagination, page-size, and the aria-live range readout

**Files:**

- Modify: `src/components/DataTable/DataTable.tsx`
- Modify: `src/components/DataTable/DataTable.module.css`
- Test: `src/components/DataTable/DataTable.test.tsx`

- [ ] **Step 1: Write failing tests** (append)

```tsx
import { Pagination } from '../Pagination'; // ensure resolvable

test('paginates via the Pagination control', async () => {
  const user = userEvent.setup();
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />); // 12 rows, size 10
  expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
  expect(screen.getByText('User 11')).toBeInTheDocument();
  expect(screen.getByText('User 12')).toBeInTheDocument();
});

test('changing page size re-pages and shows more rows', async () => {
  const user = userEvent.setup();
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />);
  await user.click(screen.getByRole('button', { name: /rows per page/i }));
  await user.click(screen.getByRole('option', { name: '25' }));
  expect(screen.getByText('User 11')).toBeInTheDocument(); // all 12 now on one page
});

test('shows an aria-live range readout', () => {
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />);
  expect(screen.getByText('1–10 of 12')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx -t paginat`
Expected: FAIL — no Pagination/page-size/readout rendered yet.

- [ ] **Step 3: Implement the footer** in `DataTable.tsx`

Add imports:

```tsx
import { Pagination } from '../Pagination';
import { Select } from '../Select';
import { pageCount } from './pipeline';
```

Remove `void setPage;` and `void setPageSize;`. Compute footer values before `return`:

```tsx
const totalPages = pageCount(total, pageSizeState);
const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSizeState + 1;
const rangeEnd = Math.min(safePage * pageSizeState, total);

const handlePageSizeChange = (value: string) => {
  setPageSize(Number(value));
  setPage(1); // reset to first page so the user isn't stranded past the new last page
};
```

Add the footer JSX after `</Table>`'s wrapping (inside the root `<div>`, after `<Table … />`):

```tsx
<div className={styles.footer}>
  <Select
    className={styles.pageSize}
    label="Rows per page"
    size="sm"
    value={String(pageSizeState)}
    onChange={handlePageSizeChange}
    options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
  />
  <span className={styles.range} aria-live="polite">
    {rangeStart}–{rangeEnd} of {total}
  </span>
  <Pagination count={totalPages} page={safePage} onPageChange={setPage} />
</div>
```

- [ ] **Step 4: Add footer styles** to `DataTable.module.css`

```css
.footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ku-space-4);
  flex-wrap: wrap;
}

.range {
  color: var(--ku-color-text-secondary);
  font-size: var(--ku-font-size-sm);
}

.pageSize {
  min-width: 0;
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/components/DataTable && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): pagination, page-size select, aria-live range readout"
```

---

## Task 9: Global search

**Files:**

- Modify: `src/components/DataTable/DataTable.tsx`
- Modify: `src/components/DataTable/DataTable.module.css`
- Test: `src/components/DataTable/DataTable.test.tsx`

- [ ] **Step 1: Write failing test** (append)

```tsx
test('global search filters rows and resets to page 1', async () => {
  const user = userEvent.setup();
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} />);
  const box = screen.getByRole('searchbox', { name: /search/i });
  await user.type(box, 'User 11');
  expect(screen.getByText('User 11')).toBeInTheDocument();
  expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
});

test('search box is hidden when searchable={false}', () => {
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} searchable={false} />);
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx -t search`
Expected: FAIL — no search box.

- [ ] **Step 3: Implement the toolbar + search** in `DataTable.tsx`

Add import:

```tsx
import { TextField } from '../TextField';
```

Remove `void setSearch;`. Add the search handler before `return`:

```tsx
const handleSearchChange = (value: string) => {
  setSearch(value);
  setPage(1);
};
```

Add the toolbar as the first child of the root `<div>` (before `<Table … />`):

```tsx
{
  searchable ? (
    <div className={styles.toolbar}>
      <TextField
        type="search"
        className={styles.search}
        label="Search"
        placeholder="Search…"
        value={searchState}
        onChange={handleSearchChange}
      />
    </div>
  ) : null;
}
```

- [ ] **Step 4: Add toolbar styles** to `DataTable.module.css`

```css
.toolbar {
  display: flex;
  align-items: flex-end;
  gap: var(--ku-space-3);
  flex-wrap: wrap;
}

.search {
  min-width: 16rem;
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/components/DataTable && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): global search box"
```

---

## Task 10: Per-column filters (text, number-range, date-range, multi-select enum)

**Files:**

- Create: `src/components/DataTable/ColumnFilter.tsx` (filter-control sub-component)
- Modify: `src/components/DataTable/DataTable.tsx`
- Modify: `src/components/DataTable/DataTable.module.css`
- Test: `src/components/DataTable/DataTable.test.tsx`

The enum filter is **multi-select**, built by composing the existing `Popover` + `Checkbox` (no multi-select primitive exists). Splitting the filter controls into `ColumnFilter.tsx` keeps `DataTable.tsx` focused.

- [ ] **Step 1: Write failing tests** (append to `DataTable.test.tsx`)

```tsx
const filterCols: DataColumn<Row>[] = [
  { key: 'name', header: 'Name', filter: 'text' },
  { key: 'age', header: 'Age', type: 'number', filter: 'number-range' },
  {
    key: 'role',
    header: 'Role',
    getValue: (r) => (Number(r.id) % 2 ? 'admin' : 'user'),
    filter: 'select',
  },
];

test('text column filter narrows rows', async () => {
  const user = userEvent.setup();
  render(
    <DataTable columns={filterCols} data={data} getRowId={(r) => r.id} defaultPageSize={25} />,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'User 1');
  // 'User 1', 'User 10', 'User 11', 'User 12' contain 'User 1'
  expect(screen.getByText('User 10')).toBeInTheDocument();
  expect(screen.queryByText('User 2')).not.toBeInTheDocument();
});

test('number-range column filter narrows rows', async () => {
  const user = userEvent.setup();
  render(
    <DataTable columns={filterCols} data={data} getRowId={(r) => r.id} defaultPageSize={25} />,
  );
  await user.type(screen.getByRole('spinbutton', { name: /Age min/i }), '30');
  // ages 30 and 31 remain (ids 11, 12)
  expect(screen.getByText('User 11')).toBeInTheDocument();
  expect(screen.queryByText('User 1')).not.toBeInTheDocument();
});

test('multi-select enum filter toggles values via checkboxes', async () => {
  const user = userEvent.setup();
  render(
    <DataTable columns={filterCols} data={data} getRowId={(r) => r.id} defaultPageSize={25} />,
  );
  await user.click(screen.getByRole('button', { name: /Role/ }));
  await user.click(screen.getByRole('checkbox', { name: 'admin' }));
  // only odd ids (admin) remain
  expect(screen.getByText('User 1')).toBeInTheDocument();
  expect(screen.queryByText('User 2')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx -t filter`
Expected: FAIL — no filter controls.

- [ ] **Step 3: Implement `ColumnFilter.tsx`**

```tsx
import { useMemo } from 'react';
import { TextField } from '../TextField';
import { Popover } from '../Popover';
import { Checkbox } from '../Checkbox';
import { getColumnValue } from './pipeline';
import type { DataColumn, FilterValue } from './types';
import styles from './DataTable.module.css';

interface ColumnFilterProps<Row> {
  column: DataColumn<Row>;
  data: Row[];
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

export function ColumnFilter<Row>({ column, data, value, onChange }: ColumnFilterProps<Row>) {
  const header = typeof column.header === 'string' ? column.header : column.key;

  if (column.filter === 'text') {
    return (
      <TextField
        className={styles.filterControl}
        size="sm"
        label={header}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (column.filter === 'number-range') {
    const range = (value && typeof value === 'object' && 'min' in value ? value : {}) as {
      min?: number;
      max?: number;
    };
    const num = (s: string): number | undefined => (s === '' ? undefined : Number(s));
    return (
      <div className={styles.rangeGroup} role="group" aria-label={header}>
        <TextField
          type="number"
          size="sm"
          label={`${header} min`}
          value={range.min?.toString() ?? ''}
          onChange={(v) => onChange({ ...range, min: num(v) })}
        />
        <TextField
          type="number"
          size="sm"
          label={`${header} max`}
          value={range.max?.toString() ?? ''}
          onChange={(v) => onChange({ ...range, max: num(v) })}
        />
      </div>
    );
  }

  if (column.filter === 'date-range') {
    const range = (value && typeof value === 'object' && 'from' in value ? value : {}) as {
      from?: string;
      to?: string;
    };
    return (
      <div className={styles.rangeGroup} role="group" aria-label={header}>
        <TextField
          type="date"
          size="sm"
          label={`${header} from`}
          value={range.from ?? ''}
          onChange={(v) => onChange({ ...range, from: v || undefined })}
        />
        <TextField
          type="date"
          size="sm"
          label={`${header} to`}
          value={range.to ?? ''}
          onChange={(v) => onChange({ ...range, to: v || undefined })}
        />
      </div>
    );
  }

  // select (multi) — distinct values from data unless filterOptions given
  const options = useMemo(() => {
    if (column.filterOptions) return column.filterOptions;
    const seen = new Set<string>();
    for (const row of data) seen.add(String(getColumnValue(column, row)));
    return [...seen].map((v) => ({ value: v, label: v }));
  }, [column, data]);
  const chosen = Array.isArray(value) ? value : [];
  const toggle = (v: string) =>
    onChange(chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v]);

  const trigger = (
    <button type="button" className={styles.filterTrigger}>
      {header}
      {chosen.length > 0 ? <span className={styles.filterCount}>{chosen.length}</span> : null}
    </button>
  );

  return (
    <Popover trigger={trigger} placement="bottom-start">
      <div className={styles.filterMenu} role="group" aria-label={header}>
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={chosen.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
        ))}
      </div>
    </Popover>
  );
}
```

> Check `Checkbox`'s prop names before wiring (`src/components/Checkbox/Checkbox.tsx`):
> use its `label` and `checked`/`onChange` API. If `Checkbox` has no `label` prop,
> wrap it with a `<label>` and a `VisuallyHidden`-free visible text node. Likewise
> confirm `Popover`'s `trigger` prop (the `Select` source in Task 0 reading shows
> `Popover` takes `trigger`, `open`, `onOpenChange`, `placement`).

- [ ] **Step 4: Render the filters region** in `DataTable.tsx`

Add import + remove `void setFilters;`:

```tsx
import { ColumnFilter } from './ColumnFilter';
```

Add the handler before `return`:

```tsx
const filterColumns = columns.filter((c) => c.filter);

const handleFilterChange = (key: string, next: import('./types').FilterValue) => {
  setFilters({ ...filterState, [key]: next });
  setPage(1);
};
```

Add the filters region after the toolbar (before `<Table … />`):

```tsx
{
  filterColumns.length > 0 ? (
    <div className={styles.filters}>
      {filterColumns.map((col) => (
        <ColumnFilter
          key={col.key}
          column={col}
          data={data}
          value={filterState[col.key]}
          onChange={(next) => handleFilterChange(col.key, next)}
        />
      ))}
    </div>
  ) : null;
}
```

- [ ] **Step 5: Add filter styles** to `DataTable.module.css`

```css
.filters {
  display: flex;
  align-items: flex-end;
  gap: var(--ku-space-3);
  flex-wrap: wrap;
}

.rangeGroup {
  display: flex;
  gap: var(--ku-space-2);
}

.filterControl {
  min-width: 10rem;
}

.filterTrigger {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-2);
  padding: var(--ku-space-2) var(--ku-space-3);
  border: 1px solid var(--ku-color-border-default);
  border-radius: var(--ku-radius-md);
  background: var(--ku-color-bg-default);
  color: var(--ku-color-text-primary);
  font: inherit;
  cursor: pointer;
}

.filterCount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25em;
  height: 1.25em;
  border-radius: var(--ku-radius-full);
  background: var(--ku-color-accent-default);
  color: var(--ku-color-text-on-accent);
  font-size: var(--ku-font-size-xs);
}

.filterMenu {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-2);
  padding: var(--ku-space-2);
  min-width: 12rem;
}
```

> Confirm the exact token names against `src/theme/tokens.ts` (e.g. accent / on-accent,
> border-default). Substitute the nearest existing token if a name differs — do
> not invent tokens.

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run src/components/DataTable && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): per-column filters (text/number-range/date-range/multi-select)"
```

---

## Task 11: Row selection (select-all = all matching) + selection toolbar

**Files:**

- Modify: `src/components/DataTable/DataTable.tsx`
- Modify: `src/components/DataTable/DataTable.module.css`
- Test: `src/components/DataTable/DataTable.test.tsx`

The scaffold already passes `selectedIds` + `selectAllIds={matchingIds}` to `Table`. This task adds the `onSelectionChange` wiring and a selection-count/clear control, and proves select-all spans pages.

- [ ] **Step 1: Write failing tests** (append)

```tsx
test('select-all selects every matching row across pages, not just the page', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectedIds={[]}
      onSelectionChange={onSelectionChange}
    />,
  ); // 12 rows, page size 10
  await user.click(screen.getByRole('checkbox', { name: /select all/i }));
  expect(onSelectionChange).toHaveBeenCalledWith(data.map((r) => r.id)); // all 12
});

test('shows a selection count and clears selection', async () => {
  const user = userEvent.setup();
  function Wrapper() {
    const [ids, setIds] = (require('react') as typeof import('react')).useState<string[]>([
      '1',
      '2',
    ]);
    return (
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectedIds={ids}
        onSelectionChange={setIds}
      />
    );
  }
  render(<Wrapper />);
  expect(screen.getByText('2 selected')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /clear selection/i }));
  expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
});
```

> If `require` is unavailable in the test environment, define the wrapper with a
> top-level `import { useState } from 'react';` instead.

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/components/DataTable/DataTable.test.tsx -t select`
Expected: FAIL — no `onSelectionChange` wired / no count control.

- [ ] **Step 3: Wire selection** in `DataTable.tsx`

Remove `void setSelected;`. Pass the handler to `Table`:

```tsx
selectedIds = { selected };
selectAllIds = { matchingIds };
onSelectionChange = { setSelected };
```

Add a selection control to the toolbar. Change the toolbar block so it always renders when there's search **or** a selection to show:

```tsx
{
  searchable || selected.length > 0 ? (
    <div className={styles.toolbar}>
      {searchable ? (
        <TextField
          type="search"
          className={styles.search}
          label="Search"
          placeholder="Search…"
          value={searchState}
          onChange={handleSearchChange}
        />
      ) : null}
      {selected.length > 0 ? (
        <div className={styles.selection}>
          <span>{selected.length} selected</span>
          <button
            type="button"
            className={styles.clearSelection}
            aria-label="Clear selection"
            onClick={() => setSelected([])}
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  ) : null;
}
```

- [ ] **Step 4: Add selection styles** to `DataTable.module.css`

```css
.selection {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-2);
  margin-inline-start: auto;
  color: var(--ku-color-text-secondary);
  font-size: var(--ku-font-size-sm);
}

.clearSelection {
  border: none;
  background: none;
  color: var(--ku-color-accent-default);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/components/DataTable && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/DataTable
git commit -m "feat(DataTable): row selection across pages + selection toolbar"
```

---

## Task 12: Public exports + full quality gates

**Files:**

- Modify: `src/index.ts`

- [ ] **Step 1: Re-export from `src/index.ts`**

Append under a new section:

```ts
// Phase 9 — DataTable (stateful Table orchestrator)
export { DataTable } from './components/DataTable';
export type {
  DataTableProps,
  DataColumn,
  ColumnType,
  FilterKind,
  FilterValue,
  FilterState,
} from './components/DataTable';
```

> `SortRule`/`SortDirection` are already exported via `Table`; do not re-export
> them here (duplicate export = TS error).

- [ ] **Step 2: Run the full gate suite**

Run:

```bash
npx tsc --noEmit
npx eslint .
npx vitest run
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(DataTable): export from package entry"
```

---

## Task 13: Storybook stories

**Files:**

- Create: `src/components/DataTable/DataTable.stories.tsx`

- [ ] **Step 1: Write the stories**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
import type { DataColumn } from './types';

interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
  joined: string;
}

const people: Person[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  name: ['Ann', 'Bob', 'Cy', 'Dee', 'Eli'][i % 5] + ` ${i + 1}`,
  role: i % 2 ? 'admin' : 'user',
  age: 22 + (i % 20),
  joined: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
}));

const columns: DataColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'role', header: 'Role', sortable: true, filter: 'select' },
  {
    key: 'age',
    header: 'Age',
    type: 'number',
    align: 'end',
    sortable: true,
    filter: 'number-range',
  },
  { key: 'joined', header: 'Joined', type: 'date', sortable: true, filter: 'date-range' },
];

const meta: Meta<typeof DataTable<Person>> = {
  title: 'Components/DataTable',
  component: DataTable,
};
export default meta;
type Story = StoryObj<typeof DataTable<Person>>;

export const Showcase: Story = {
  args: { columns, data: people, getRowId: (r) => r.id, caption: 'Team members' },
};

export const WithSelection: Story = {
  args: { columns, data: people, getRowId: (r) => r.id, defaultSelectedIds: ['1', '2', '3'] },
};

export const Loading: Story = {
  args: { columns, data: [], getRowId: (r: Person) => r.id, loading: true },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    getRowId: (r: Person) => r.id,
    empty: 'No team members match your filters.',
  },
};
```

> Match the meta/story style used by `Table.stories.tsx` (open it first); adjust
> imports if this repo's stories use a different `Meta` import path.

- [ ] **Step 2: Verify Storybook builds the stories**

Run: `npm run build:tokens && npx storybook build` (or start `npm run storybook` and open the DataTable stories)
Expected: builds with no errors; all four stories render.

- [ ] **Step 3: Commit**

```bash
git add src/components/DataTable/DataTable.stories.tsx
git commit -m "docs(DataTable): Storybook stories"
```

---

## Task 14: e2e accessibility + visual baselines

**Files:**

- Modify: `e2e/components.spec.ts`

- [ ] **Step 1: Register DataTable stories in the e2e list**

Open `e2e/components.spec.ts` and add `DataTable` story ids to the component list the spec iterates (follow the existing pattern — likely an array of `{ name, storyId }`). Add at least:

```ts
{ name: 'DataTable', storyId: 'components-datatable--showcase' },
{ name: 'DataTable selection', storyId: 'components-datatable--with-selection' },
```

Match the exact shape of the existing entries (read the top of the file first).

- [ ] **Step 2: Run axe locally in both themes**

Run: `npm run test:e2e -- --grep axe`
Expected: PASS — zero violations for the new stories in dark + light. Fix any labeling gaps (every filter control, the search box, and the page-size select must have an accessible name).

- [ ] **Step 3: Generate Linux visual baselines on the hosted runner**

Per `linux-visual-baseline-workflow`: do NOT generate locally in Docker (renders differ from the runner). On the feature branch:

```bash
git push -u origin <feature-branch>
gh workflow run update-baselines.yml --ref <feature-branch>
gh run watch <run-id> --exit-status
git pull --ff-only   # pulls the bot's committed *-chromium-linux.png
```

(If dispatching by branch fails because `update-baselines.yml` isn't on the default branch yet, it already is — it merged in PR #1. If it ever regresses, temporarily add a `push:` trigger as documented in the memory note.)

- [ ] **Step 4: Run the full visual suite locally is not reliable; rely on the PR CI**

Open a PR; the `ci` check runs axe + visual on `ubuntu-24.04` against the committed baselines.
Expected: green.

- [ ] **Step 5: Commit (baselines were committed by the workflow) + update CHANGELOG**

Add a CHANGELOG entry under a new unreleased section describing `DataTable`, then:

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for DataTable"
```

---

## Self-Review

**Spec coverage:**

- Client-side sort (single + multi, type-aware, custom compare) → Tasks 3, 7 + Table Task 1. ✅
- Pagination + page size + range readout → Task 8. ✅
- Selection = all matching rows across pages → Table Task 1 (`selectAllIds`) + Task 11. ✅
- Global search → Task 5 (pipeline) + Task 9 (UI). ✅
- Per-column filters: text/select(multi)/number-range/date-range → Task 4 (pipeline) + Task 10 (UI). ✅
- Uncontrolled-by-default + controllable for every state → Task 6 (`useControllableState` for all six state slices). ✅
- Forward `Table` loading/empty/sticky/caption → Task 6. ✅
- Auto-derived select options → Task 10 (`ColumnFilter`). ✅
- Page clamping without surprise callbacks → Task 5 (`clampPage`, render-only). ✅
- aria-live range region + labeled controls → Tasks 8, 9, 10. ✅
- Exports of every public type → Tasks 2, 6 (index), 12 (src/index). ✅
- Testing: unit + component + a11y + visual → Tasks 3–11 (unit/component), 14 (a11y/visual). ✅
- `Table.selectAllIds` additive change + multi-sort extension → Task 1. ✅

**Placeholder scan:** No `TBD`/`TODO`/"add error handling". Each code step shows real code; each test step shows real assertions. Two flagged verification points (Checkbox/Popover prop names in Task 10; token names in Tasks 1/10) are explicit "confirm against source" notes, not placeholders — the executor reads the named file and substitutes the real name.

**Type consistency:** `SortRule`/`SortDirection` defined in `Table` (Task 1), re-exported through `DataTable/types.ts` (Task 2); `FilterValue`/`FilterState`/`DataColumn`/`DataTableProps` defined once in Task 2 and used unchanged in Tasks 6–12. Pipeline function names (`getColumnValue`, `applySort`, `applyColumnFilters`, `applyGlobalSearch`, `paginate`, `pageCount`, `clampPage`, `cycleSort`, `runPipeline`) are consistent across Tasks 3–8 and their call sites in Tasks 6–11.

**Scope:** Single component + one supporting `Table` change — fits one plan.
