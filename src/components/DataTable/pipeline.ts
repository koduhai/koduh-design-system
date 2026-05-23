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
