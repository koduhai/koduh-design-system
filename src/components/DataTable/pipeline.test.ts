import { expect, test } from 'vitest';
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
