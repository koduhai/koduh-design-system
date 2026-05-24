import type { ColumnType, DataColumn, FilterState, FilterValue, SortRule } from './types';

export function getColumnValue<Row>(col: DataColumn<Row>, row: Row): string | number | Date {
  if (col.getValue) return col.getValue(row);
  return (row as Record<string, unknown>)[col.key] as string | number | Date;
}

/**
 * Reduce a raw cell value to something comparable, or `null` when the value is
 * "missing" for the given type. Missing means: null/undefined, empty/whitespace
 * string, a non-numeric value in a number column, or an unparseable date.
 * Returning `null` lets the comparator apply a deterministic nulls-last policy
 * instead of letting NaN/"null" leak into the ordering.
 */
function toComparable(value: unknown, type: ColumnType): number | string | null {
  if (value == null) return null;

  if (type === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(n) ? null : n;
  }

  if (type === 'date') {
    const t = value instanceof Date ? value.getTime() : new Date(value as string).getTime();
    return Number.isNaN(t) ? null : t;
  }

  // text
  const s = String(value);
  return s.trim() === '' ? null : s;
}

/**
 * Compares two real (non-null) comparable values. Null handling is done by the
 * caller (defaultCompare) so it can stay direction-independent.
 */
function compareValues(av: number | string, bv: number | string, type: ColumnType): number {
  if (type === 'text') return String(av).localeCompare(String(bv));
  return av < bv ? -1 : av > bv ? 1 : 0;
}

/**
 * Result of a single comparison, split so applySort can apply sort direction to
 * the value ordering while keeping the nulls-last policy fixed regardless of
 * direction.
 *   - `nulls`: -1/0/1 ordering driven purely by missing-ness (never negated).
 *   - `values`: -1/0/1 ordering of the real values (negated for 'desc').
 * When both values are missing, both are 0 and the next rule / stable order wins.
 */
interface CompareParts {
  nulls: number;
  values: number;
}

function defaultCompareParts(a: unknown, b: unknown, type: ColumnType): CompareParts {
  const av = toComparable(a, type);
  const bv = toComparable(b, type);
  if (av === null && bv === null) return { nulls: 0, values: 0 };
  if (av === null) return { nulls: 1, values: 0 }; // a missing → a after b
  if (bv === null) return { nulls: -1, values: 0 }; // b missing → a before b
  return { nulls: 0, values: compareValues(av, bv, type) };
}

export function applySort<Row>(rows: Row[], sort: SortRule[], columns: DataColumn<Row>[]): Row[] {
  if (sort.length === 0) return rows.slice();
  const byKey = new Map(columns.map((c) => [c.key, c] as const));
  // Array.prototype.sort is stable (ES2019+), so equal rows keep input order.
  return rows.slice().sort((a, b) => {
    for (const rule of sort) {
      const col = byKey.get(rule.key);
      if (!col) continue;
      if (col.compare) {
        // Consumer-supplied comparator: respect direction wholesale.
        let cmp = col.compare(a, b);
        if (rule.dir === 'desc') cmp = -cmp;
        if (cmp !== 0) return cmp;
        continue;
      }
      // Default path: nulls-last is fixed for both directions; only the
      // real-value ordering flips for 'desc'.
      const { nulls, values } = defaultCompareParts(
        getColumnValue(col, a),
        getColumnValue(col, b),
        col.type ?? 'text',
      );
      if (nulls !== 0) return nulls;
      const cmp = rule.dir === 'desc' ? -values : values;
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function matches(value: string | number | Date, filter: FilterValue): boolean {
  if (typeof filter === 'string') {
    if (filter === '') return true;
    return String(value).toLowerCase().includes(filter.toLowerCase());
  }
  if (Array.isArray(filter)) {
    if (filter.length === 0) return true;
    return filter.includes(String(value));
  }
  if ('min' in filter || 'max' in filter) {
    const n = Number(value);
    if (filter.min != null && n < filter.min) return false;
    if (filter.max != null && n > filter.max) return false;
    return true;
  }
  if ('from' in filter || 'to' in filter) {
    const t = value instanceof Date ? value.getTime() : new Date(value as string).getTime();
    if (Number.isNaN(t)) return false; // unparseable/missing date never matches a range
    if (filter.from && t < new Date(filter.from).getTime()) return false;
    if (filter.to) {
      // The `to` bound is inclusive of the entire day. A date string like
      // '2020-12-31' parses to midnight UTC, which would exclude same-day
      // datetime rows; advance the bound to the end of that day.
      const toEnd = new Date(filter.to).getTime() + DAY_MS - 1;
      if (t > toEnd) return false;
    }
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
    active.every((col) => matches(getColumnValue(col, row), filters[col.key]!)),
  );
}

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
  if (!existing) return [{ key, dir: 'asc' }];
  if (existing.dir === 'asc') return [{ key, dir: 'desc' }];
  return []; // desc → none
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
