import { test, expect } from 'vitest';
import { vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

test('renders noResults (not empty) when a non-empty dataset is filtered to zero rows', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
      data={data}
      getRowId={(r) => r.id}
      empty={<span>Nothing here yet</span>}
      noResults={<span>No matches — clear your filters</span>}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz no such row');
  expect(screen.getByText('No matches — clear your filters')).toBeInTheDocument();
  expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
});

test('function empty receives hasData/isFiltered context for the two empty cases', async () => {
  const user = userEvent.setup();
  const renderEmpty = ({ hasData, isFiltered }: { hasData: boolean; isFiltered: boolean }) => (
    <span>{isFiltered ? 'filtered-empty' : hasData ? 'has-data' : 'no-data'}</span>
  );
  // Truly empty dataset → no-data.
  const { rerender } = render(
    <DataTable
      columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
      data={[]}
      getRowId={(r: Row) => r.id}
      empty={renderEmpty}
    />,
  );
  expect(screen.getByText('no-data')).toBeInTheDocument();
  // Non-empty dataset filtered to nothing → filtered-empty.
  rerender(
    <DataTable
      columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
      data={data}
      getRowId={(r) => r.id}
      empty={renderEmpty}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz');
  expect(screen.getByText('filtered-empty')).toBeInTheDocument();
});

test('loadingRows defaults to the effective pageSize', () => {
  const { container } = render(
    <DataTable columns={columns} data={data} getRowId={(r) => r.id} loading defaultPageSize={25} />,
  );
  // One header row + 25 skeleton body rows.
  expect(container.querySelectorAll('tbody tr')).toHaveLength(25);
});

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
  const firstAsc = screen.getAllByRole('row')[1]!;
  expect(within(firstAsc).getByText('20')).toBeInTheDocument(); // youngest first
  await user.click(ageHeader);
  const firstDesc = screen.getAllByRole('row')[1]!;
  expect(within(firstDesc).getByText('31')).toBeInTheDocument(); // oldest first (20+11)
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
  const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
  const ageHeader = screen.getByRole('columnheader', { name: /Age/ });
  expect(within(nameHeader).getByText('1')).toBeInTheDocument(); // priority badge for Name
  expect(within(ageHeader).getByText('2')).toBeInTheDocument(); // priority badge for Age
});

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

// ─── Per-column filter tests ──────────────────────────────────────────────────

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
  expect(screen.getByText('User 10')).toBeInTheDocument();
  expect(screen.queryByText('User 2')).not.toBeInTheDocument();
});

test('number-range column filter narrows rows', async () => {
  const user = userEvent.setup();
  render(
    <DataTable columns={filterCols} data={data} getRowId={(r) => r.id} defaultPageSize={25} />,
  );
  await user.type(screen.getByRole('spinbutton', { name: /Age min/i }), '30');
  expect(screen.getByText('User 11')).toBeInTheDocument(); // age 30
  expect(screen.queryByText('User 1')).not.toBeInTheDocument(); // age 20
});

test('multi-select enum filter toggles values via checkboxes', async () => {
  const user = userEvent.setup();
  render(
    <DataTable columns={filterCols} data={data} getRowId={(r) => r.id} defaultPageSize={25} />,
  );
  await user.click(screen.getByRole('button', { name: /Role/ }));
  await user.click(screen.getByRole('checkbox', { name: 'admin' }));
  expect(screen.getByText('User 1')).toBeInTheDocument(); // id 1 odd → admin
  expect(screen.queryByText('User 2')).not.toBeInTheDocument(); // id 2 even → user
});

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
    const [ids, setIds] = useState<string[]>(['1', '2']);
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

test('selection toolbar appears even when searchable is false', () => {
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      searchable={false}
      selectedIds={['1', '2', '3']}
      onSelectionChange={() => {}}
    />,
  );
  expect(screen.getByText('3 selected')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});

test('controlled sort: clicking a header fires onSortChange and respects the controlled value', async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  function Controlled() {
    const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }[]>([]);
    return (
      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'age', header: 'Age', type: 'number', sortable: true },
        ]}
        data={data}
        getRowId={(r) => r.id}
        defaultPageSize={25}
        sort={sort}
        onSortChange={(s) => {
          onSortChange(s);
          setSort(s);
        }}
      />
    );
  }
  render(<Controlled />);
  await user.click(screen.getByRole('button', { name: /Age/ }));
  expect(onSortChange).toHaveBeenCalledWith([{ key: 'age', dir: 'asc' }]);
  // controlled value applied → youngest (age 20) first
  const firstRow = screen.getAllByRole('row')[1]!;
  expect(within(firstRow).getByText('20')).toBeInTheDocument();
});

test('controlled page settles on the clamped page when a filter shrinks results', async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();
  function Controlled() {
    const [page, setPage] = useState(2); // start on page 2 (12 rows / size 10 = 2 pages)
    return (
      <DataTable
        columns={[
          { key: 'name', header: 'Name', filter: 'text' },
          { key: 'age', header: 'Age', type: 'number' },
        ]}
        data={data}
        getRowId={(r) => r.id}
        page={page}
        onPageChange={(p) => {
          onPageChange(p);
          setPage(p);
        }}
      />
    );
  }
  render(<Controlled />);
  // On page 2 we see User 11/12.
  expect(screen.getByText('User 11')).toBeInTheDocument();
  // Typing a filter that matches a single row collapses results to 1 page.
  // handleFilterChange already resets to page 1; even if it didn't, the
  // reconciliation effect must converge the controlled parent onto the clamp.
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'User 5');
  // onPageChange fired with the clamped page (1) and the view shows the match.
  expect(onPageChange).toHaveBeenCalledWith(1);
  expect(screen.getByText('User 5')).toBeInTheDocument();
  expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
});

test('controlled page reconciles via effect when data shrinks (no filter reset path)', async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();
  function Controlled() {
    const [rows, setRows] = useState(data); // 12 rows → 2 pages at size 10
    const [page, setPage] = useState(2);
    return (
      <>
        <button type="button" onClick={() => setRows(data.slice(0, 3))}>
          shrink
        </button>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          page={page}
          onPageChange={(p) => {
            onPageChange(p);
            setPage(p);
          }}
        />
      </>
    );
  }
  render(<Controlled />);
  expect(screen.getByText('User 11')).toBeInTheDocument(); // on page 2
  // Shrinking data to 3 rows leaves only 1 page. There is NO setPage(1) call on
  // this path — only the reconciliation effect can converge the controlled page.
  await user.click(screen.getByRole('button', { name: 'shrink' }));
  expect(onPageChange).toHaveBeenCalledWith(1);
  expect(screen.getByText('1–3 of 3')).toBeInTheDocument();
  expect(screen.getByText('User 1')).toBeInTheDocument();
});

test('uncontrolled high page is clamped and settles without onPageChange errors', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', filter: 'text' },
        { key: 'age', header: 'Age', type: 'number' },
      ]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
  expect(screen.getByText('User 11')).toBeInTheDocument();
  // Filter down to a single row while on page 2.
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'User 5');
  expect(screen.getByText('User 5')).toBeInTheDocument();
  expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
});

test('filter, sort, and pagination compose together', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', filter: 'text' },
        { key: 'age', header: 'Age', type: 'number', sortable: true },
      ]}
      data={data}
      getRowId={(r) => r.id}
      defaultPageSize={5}
    />,
  );
  // filter to the 4 rows whose name contains 'User 1' (User 1, 10, 11, 12; ages 20,29,30,31)
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'User 1');
  // sort by age descending (click Age twice: asc then desc)
  const ageHeader = screen.getByRole('button', { name: /Age/ });
  await user.click(ageHeader);
  await user.click(ageHeader);
  // 4 matching rows, pageSize 5 → all on one page, oldest first (age 31 = User 12)
  const firstRow = screen.getAllByRole('row')[1]!;
  expect(within(firstRow).getByText('31')).toBeInTheDocument();
  expect(screen.getByText('1–4 of 4')).toBeInTheDocument(); // en-dash
});
