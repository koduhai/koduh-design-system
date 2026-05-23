import { expect, test } from 'vitest';
import { getColumnValue, applySort, applyColumnFilters } from './pipeline';
import type { DataColumn, FilterState } from './types';

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
  { key: 'name', header: 'Name', type: 'text', filter: 'text' },
  { key: 'age', header: 'Age', type: 'number', filter: 'number-range' },
  { key: 'joined', header: 'Joined', type: 'date', filter: 'date-range' },
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
