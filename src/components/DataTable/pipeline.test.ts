import { expect, test } from 'vitest';
import {
  getColumnValue,
  applySort,
  applyColumnFilters,
  applyGlobalSearch,
  paginate,
  pageCount,
  clampPage,
  runPipeline,
} from './pipeline';
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

test('number-range min of 0 is respected (not treated as absent)', () => {
  // all ages are >= 0, so min:0 keeps everything
  expect(applyColumnFilters(data, { age: { min: 0 } }, columns)).toHaveLength(3);
});

test('multiple active filters combine with AND', () => {
  // name contains 'b' → only Bob(1); age <= 30 keeps Bob too
  expect(
    applyColumnFilters(data, { name: 'b', age: { max: 30 } }, columns).map((r) => r.id),
  ).toEqual(['1']);
  // name contains 'b' but age < 30 excludes Bob(30) → empty
  expect(applyColumnFilters(data, { name: 'b', age: { max: 29 } }, columns)).toHaveLength(0);
});

test('empty date-range object is a no-op', () => {
  expect(applyColumnFilters(data, { joined: {} }, columns)).toHaveLength(3);
});

test('a column without `filter` set does not participate even if filters has its key', () => {
  // build columns where `name` has NO filter kind
  const noFilterCols: DataColumn<Row>[] = columns.map((c) =>
    c.key === 'name' ? { ...c, filter: undefined } : c,
  );
  expect(applyColumnFilters(data, { name: 'zzz-no-match' }, noFilterCols)).toHaveLength(3);
});

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
