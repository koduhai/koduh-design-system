import type { ColumnType, DataColumn, FilterState, FilterValue, SortRule } from './types';

export function getColumnValue<Row>(col: DataColumn<Row>, row: Row): string | number | Date {
  if (col.getValue) return col.getValue(row);
  return (row as Record<string, unknown>)[col.key] as string | number | Date;
}

function toComparable(value: string | number | Date, type: ColumnType): number | string {
  if (type === 'number') return typeof value === 'number' ? value : Number(value);
  if (type === 'date')
    return value instanceof Date ? value.getTime() : new Date(value as string).getTime();
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
