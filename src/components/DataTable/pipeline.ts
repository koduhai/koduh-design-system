import type { ColumnType, DataColumn, SortRule } from './types';

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
