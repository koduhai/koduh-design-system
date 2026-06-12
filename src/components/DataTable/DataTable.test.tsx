import { test, expect } from 'vitest';
import { vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { DataColumn } from './types';
import { KoduhI18nProvider } from '../../i18n';

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
      noResults={<span>No matches, clear your filters</span>}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz no such row');
  expect(screen.getByText('No matches, clear your filters')).toBeInTheDocument();
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

// ─── Row expansion ────────────────────────────────────────────────────────────

test('renders an expand toggle per row and reveals/hides the detail row', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      renderExpanded={(r) => <div>Detail for {r.name}</div>}
    />,
  );
  // Detail content not rendered until expanded.
  expect(screen.queryByText('Detail for User 1')).not.toBeInTheDocument();
  const toggle = screen.getByRole('button', { name: 'Expand row 1' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await user.click(toggle);
  expect(screen.getByRole('button', { name: 'Collapse row 1' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const detail = screen.getByText('Detail for User 1');
  expect(detail.closest('tr')).not.toHaveAttribute('hidden');
});

test('expansion toggle is wired to the detail row via aria-controls', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      renderExpanded={(r) => <div>Detail {r.id}</div>}
    />,
  );
  const toggle = screen.getByRole('button', { name: 'Expand row 2' });
  await user.click(toggle);
  const controls = toggle.getAttribute('aria-controls');
  expect(controls).toBeTruthy();
  expect(document.getElementById(controls!)).toHaveTextContent('Detail 2');
});

test('controlled expanded state is honored and onExpandedChange fires', async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn();
  function Controlled() {
    const [ids, setIds] = useState<string[]>(['1']);
    return (
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        expandedIds={ids}
        onExpandedChange={(next) => {
          onExpandedChange(next);
          setIds(next);
        }}
        renderExpanded={(r) => <div>Detail for {r.name}</div>}
      />
    );
  }
  render(<Controlled />);
  // Row 1 starts expanded (controlled).
  expect(screen.getByText('Detail for User 1').closest('tr')).not.toHaveAttribute('hidden');
  // Expanding row 2 appends to the set.
  await user.click(screen.getByRole('button', { name: 'Expand row 2' }));
  expect(onExpandedChange).toHaveBeenCalledWith(['1', '2']);
});

test('expandable path still renders custom cell renderers and selection', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', render: (r) => <b>{r.name.toUpperCase()}</b> },
        { key: 'age', header: 'Age', type: 'number' },
      ]}
      data={data}
      getRowId={(r) => r.id}
      selectedIds={[]}
      onSelectionChange={onSelectionChange}
      renderExpanded={(r) => <div>{r.name}</div>}
    />,
  );
  expect(screen.getByText('USER 1')).toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
  expect(onSelectionChange).toHaveBeenCalledWith(['1']);
});

test('expandable path supports sorting via header click', async () => {
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
      renderExpanded={(r) => <div>{r.id}</div>}
    />,
  );
  await user.click(screen.getByRole('button', { name: /Age/ }));
  const firstAsc = screen.getAllByRole('row')[1]!;
  expect(within(firstAsc).getByText('20')).toBeInTheDocument();
});

// ─── Column resize ─────────────────────────────────────────────────────────────

test('resizableColumns renders a keyboard-operable resize separator per column', () => {
  render(<DataTable columns={columns} data={data} getRowId={(r) => r.id} resizableColumns />);
  const handles = screen.getAllByRole('separator', { name: /Resize .* column/i });
  expect(handles).toHaveLength(columns.length);
  expect(handles[0]).toHaveAttribute('tabindex', '0');
});

test('ArrowRight/ArrowLeft on the resize handle adjusts and persists column width', async () => {
  const user = userEvent.setup();
  const onColumnWidthsChange = vi.fn();
  function Controlled() {
    const [widths, setWidths] = useState<Record<string, number>>({ name: 120 });
    return (
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        resizableColumns
        resizeStep={20}
        columnWidths={widths}
        onColumnWidthsChange={(next) => {
          onColumnWidthsChange(next);
          setWidths(next);
        }}
      />
    );
  }
  render(<Controlled />);
  const handle = screen.getByRole('separator', { name: 'Resize Name column' });
  handle.focus();
  await user.keyboard('{ArrowRight}');
  expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 140 });
  await user.keyboard('{ArrowLeft}');
  expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 120 });
});

test('resize width does not drop below the column minWidth', async () => {
  const user = userEvent.setup();
  const onColumnWidthsChange = vi.fn();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', minWidth: 100 },
        { key: 'age', header: 'Age', type: 'number' },
      ]}
      data={data}
      getRowId={(r) => r.id}
      resizableColumns
      resizeStep={50}
      defaultColumnWidths={{ name: 110 }}
      onColumnWidthsChange={onColumnWidthsChange}
    />,
  );
  const handle = screen.getByRole('separator', { name: 'Resize Name column' });
  handle.focus();
  await user.keyboard('{ArrowLeft}'); // 110 - 50 = 60, clamped to 100
  expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 100 });
});

test('resize separator seeds aria-valuenow and aria-valuemin before any resize', () => {
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', width: '180px', minWidth: 100 },
        { key: 'age', header: 'Age', type: 'number' },
      ]}
      data={data}
      getRowId={(r) => r.id}
      resizableColumns
    />,
  );
  const nameHandle = screen.getByRole('separator', { name: 'Resize Name column' });
  // Seeded from the configured px width, with the lower bound from minWidth.
  expect(nameHandle).toHaveAttribute('aria-valuenow', '180');
  expect(nameHandle).toHaveAttribute('aria-valuemin', '100');
  // A column without a configured width falls back to the default min (48).
  const ageHandle = screen.getByRole('separator', { name: 'Resize Age column' });
  expect(ageHandle).toHaveAttribute('aria-valuenow', '48');
  expect(ageHandle).toHaveAttribute('aria-valuemin', '48');
});

test('keyboard resize inverts direction in RTL to match the pointer drag', async () => {
  const user = userEvent.setup();
  const onColumnWidthsChange = vi.fn();
  document.dir = 'rtl';
  try {
    function Controlled() {
      const [widths, setWidths] = useState<Record<string, number>>({ name: 120 });
      return (
        <DataTable
          columns={columns}
          data={data}
          getRowId={(r) => r.id}
          resizableColumns
          resizeStep={20}
          columnWidths={widths}
          onColumnWidthsChange={(next) => {
            onColumnWidthsChange(next);
            setWidths(next);
          }}
        />
      );
    }
    render(<Controlled />);
    const handle = screen.getByRole('separator', { name: 'Resize Name column' });
    handle.focus();
    // In RTL, ArrowLeft grows the column (inverse of LTR).
    await user.keyboard('{ArrowLeft}');
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 140 });
    await user.keyboard('{ArrowRight}');
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 120 });
  } finally {
    document.dir = '';
  }
});

test('a column with resizable:false gets no handle', () => {
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age', type: 'number', resizable: false },
      ]}
      data={data}
      getRowId={(r) => r.id}
      resizableColumns
    />,
  );
  expect(screen.getByRole('separator', { name: 'Resize Name column' })).toBeInTheDocument();
  expect(screen.queryByRole('separator', { name: 'Resize Age column' })).not.toBeInTheDocument();
});

// ─── Server-side / manual mode ───────────────────────────────────────────────────

test('onStateChange surfaces sort/filter/search/page state for remote fetching', async () => {
  const user = userEvent.setup();
  const onStateChange = vi.fn();
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', sortable: true, filter: 'text' },
        { key: 'age', header: 'Age', type: 'number' },
      ]}
      data={data}
      getRowId={(r) => r.id}
      onStateChange={onStateChange}
    />,
  );
  // Fires on mount with the initial state.
  expect(onStateChange).toHaveBeenCalledWith(
    expect.objectContaining({ page: 1, pageSize: 10, sort: [], search: '' }),
  );
  onStateChange.mockClear();
  await user.click(screen.getByRole('button', { name: /Name/ }));
  expect(onStateChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ sort: [{ key: 'name', dir: 'asc' }] }),
  );
});

test('onStateChange does not re-fire on a parent re-render with an inline callback', async () => {
  const user = userEvent.setup();
  const onStateChange = vi.fn();
  function Wrapper() {
    const [, force] = useState(0);
    return (
      <>
        <button type="button" onClick={() => force((n) => n + 1)}>
          rerender
        </button>
        <DataTable
          columns={columns}
          data={data}
          getRowId={(r) => r.id}
          // Intentionally an inline arrow: a new identity every render.
          onStateChange={(s) => onStateChange(s)}
        />
      </>
    );
  }
  render(<Wrapper />);
  // Fires once on mount.
  expect(onStateChange).toHaveBeenCalledTimes(1);
  // A parent re-render that changes no table state must not re-fire it.
  await user.click(screen.getByRole('button', { name: 'rerender' }));
  expect(onStateChange).toHaveBeenCalledTimes(1);
});

test('manual mode bypasses the client pipeline: shows given rows and uses rowCount', () => {
  // Only 2 rows supplied as the "current page", but rowCount says 57 total.
  const pageRows: Row[] = [
    { id: '1', name: 'Server A', age: 40 },
    { id: '2', name: 'Server B', age: 41 },
  ];
  render(
    <DataTable
      columns={columns}
      data={pageRows}
      getRowId={(r) => r.id}
      manual
      rowCount={57}
      pageSize={2}
    />,
  );
  expect(screen.getByText('Server A')).toBeInTheDocument();
  expect(screen.getByText('Server B')).toBeInTheDocument();
  // Range readout reflects the server-provided total, not the 2 local rows.
  expect(screen.getByText('1–2 of 57')).toBeInTheDocument();
});

test('manual mode does not re-sort the supplied rows on header click', async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  const onStateChange = vi.fn();
  // Rows are intentionally out of age order; manual mode must leave them as-is.
  const pageRows: Row[] = [
    { id: '1', name: 'Z', age: 99 },
    { id: '2', name: 'A', age: 1 },
  ];
  render(
    <DataTable
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'age', header: 'Age', type: 'number', sortable: true },
      ]}
      data={pageRows}
      getRowId={(r) => r.id}
      manual
      rowCount={2}
      pageSize={2}
      onSortChange={onSortChange}
      onStateChange={onStateChange}
    />,
  );
  await user.click(screen.getByRole('button', { name: /Age/ }));
  // Sort intent is surfaced to the caller…
  expect(onSortChange).toHaveBeenCalledWith([{ key: 'age', dir: 'asc' }]);
  expect(onStateChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ sort: [{ key: 'age', dir: 'asc' }] }),
  );
  // …but the rendered order is untouched (caller owns fetching).
  const firstRow = screen.getAllByRole('row')[1]!;
  expect(within(firstRow).getByText('99')).toBeInTheDocument();
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

// ─── i18n catalog (issue #41) ─────────────────────────────────────────────────
// The built-in empty / no-results copy now comes from the i18n catalog. With no
// provider the English defaults match the prior built-in text; a provider
// override flows through; and a per-call `empty`/`noResults` prop still wins.

test('uses the catalog empty default for a genuinely empty dataset (no provider)', () => {
  render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} />);
  expect(screen.getByText('No data')).toBeInTheDocument();
});

test('uses the catalog noResults default when a dataset is filtered to zero rows (no provider)', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz no such row');
  expect(screen.getByText('No matching results')).toBeInTheDocument();
});

test('a provider message override flows through to the empty default', () => {
  render(
    <KoduhI18nProvider messages={{ dataTable: { empty: 'Aucune donnée' } }}>
      <DataTable columns={columns} data={[]} getRowId={(r) => r.id} />
    </KoduhI18nProvider>,
  );
  expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  expect(screen.queryByText('No data')).not.toBeInTheDocument();
});

test('a provider noResults override flows through for the filter-miss case', async () => {
  const user = userEvent.setup();
  render(
    <KoduhI18nProvider messages={{ dataTable: { noResults: 'Aucun résultat' } }}>
      <DataTable
        columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
        data={data}
        getRowId={(r) => r.id}
      />
    </KoduhI18nProvider>,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz no such row');
  expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
  expect(screen.queryByText('No matching results')).not.toBeInTheDocument();
});

test('the empty prop still overrides the provider default', () => {
  render(
    <KoduhI18nProvider messages={{ dataTable: { empty: 'Aucune donnée' } }}>
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(r) => r.id}
        empty={<span>Nothing here</span>}
      />
    </KoduhI18nProvider>,
  );
  expect(screen.getByText('Nothing here')).toBeInTheDocument();
  expect(screen.queryByText('Aucune donnée')).not.toBeInTheDocument();
});

test('the noResults prop still overrides the provider default for the filter-miss case', async () => {
  const user = userEvent.setup();
  render(
    <KoduhI18nProvider messages={{ dataTable: { noResults: 'Aucun résultat' } }}>
      <DataTable
        columns={[{ key: 'name', header: 'Name', filter: 'text' }]}
        data={data}
        getRowId={(r) => r.id}
        noResults={<span>No matches, clear your filters</span>}
      />
    </KoduhI18nProvider>,
  );
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'zzz no such row');
  expect(screen.getByText('No matches, clear your filters')).toBeInTheDocument();
  expect(screen.queryByText('Aucun résultat')).not.toBeInTheDocument();
});

// ─── Virtualization (#37) ─────────────────────────────────────────────────────

interface BigRow {
  id: string;
  name: string;
}
const bigData: BigRow[] = Array.from({ length: 100 }, (_, i) => ({
  id: String(i),
  name: `Row ${i}`,
}));
const bigColumns: DataColumn<BigRow>[] = [{ key: 'name', header: 'Name', sortable: true }];

function renderVirtual(extra?: Partial<Parameters<typeof DataTable<BigRow>>[0]>) {
  return render(
    <DataTable
      virtualized
      columns={bigColumns}
      data={bigData}
      getRowId={(r) => r.id}
      rowHeight={40}
      viewportHeight={200}
      overscan={2}
      {...extra}
    />,
  );
}

test('virtualized: renders only a windowed subset with aria-rowcount over the full set', () => {
  renderVirtual();
  // visibleCount = ceil(200/40) + 2*2 = 5 + 4 = 9 → rows 0..8 mount at scrollTop 0.
  expect(screen.getByText('Row 0')).toBeInTheDocument();
  expect(screen.queryByText('Row 50')).toBeNull();
  expect(screen.queryByText('Row 99')).toBeNull();
  // aria-rowcount = header (1) + 100 data rows.
  expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '101');
});

test('virtualized: data rows carry the absolute aria-rowindex (header is 1)', () => {
  renderVirtual();
  expect(screen.getByText('Row 0').closest('tr')).toHaveAttribute('aria-rowindex', '2');
  expect(screen.getByText('Row 1').closest('tr')).toHaveAttribute('aria-rowindex', '3');
});

test('virtualized: scrolling renders later rows and unmounts earlier ones', () => {
  renderVirtual();
  const viewport = screen.getByRole('table').parentElement as HTMLElement;
  // Scroll so row ~50 is in view (50 * 40px).
  fireEvent.scroll(viewport, { target: { scrollTop: 2000 } });
  expect(screen.getByText('Row 50')).toBeInTheDocument();
  expect(screen.queryByText('Row 0')).toBeNull();
  // The absolute aria-rowindex still reflects the real position.
  expect(screen.getByText('Row 50').closest('tr')).toHaveAttribute('aria-rowindex', '52');
});

test('virtualized: footer shows the total row count, not pagination', () => {
  renderVirtual();
  expect(screen.getByText('100 rows')).toBeInTheDocument();
  // No pagination nav / rows-per-page select in the virtual footer.
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.queryByRole('button', { name: /Rows per page/ })).toBeNull();
});

test('virtualized: select-all selects every matching row, including off-screen', () => {
  const onSelectionChange = vi.fn();
  renderVirtual({ onSelectionChange });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
  expect(onSelectionChange.mock.calls[0]![0]).toHaveLength(100);
});

test('virtualized: sorting reorders the full dataset (desc brings Row 99 into view)', () => {
  renderVirtual();
  const header = screen.getByRole('button', { name: /Name/ });
  fireEvent.click(header); // asc
  fireEvent.click(header); // desc
  // String-desc of "Row 0".."Row 99" puts "Row 99" first.
  expect(screen.getByText('Row 99')).toBeInTheDocument();
  expect(screen.getByText('Row 99').closest('tr')).toHaveAttribute('aria-rowindex', '2');
});

test('virtualized is ignored in manual mode (paginated path renders)', () => {
  render(
    <DataTable
      virtualized
      manual
      rowCount={100}
      columns={bigColumns}
      data={bigData.slice(0, 10)}
      getRowId={(r) => r.id}
    />,
  );
  expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount');
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('virtualized is ignored when renderExpanded is set (expandable path renders)', () => {
  render(
    <DataTable
      virtualized
      renderExpanded={(r) => <span>detail {r.name}</span>}
      columns={bigColumns}
      data={bigData.slice(0, 5)}
      getRowId={(r) => r.id}
    />,
  );
  expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount');
});

test('virtualized: i18n row count flows through a provider override', () => {
  render(
    <KoduhI18nProvider messages={{ dataTable: { rowCount: (n) => `${n} lignes` } }}>
      <DataTable
        virtualized
        columns={bigColumns}
        data={bigData}
        getRowId={(r) => r.id}
        rowHeight={40}
        viewportHeight={200}
      />
    </KoduhI18nProvider>,
  );
  expect(screen.getByText('100 lignes')).toBeInTheDocument();
});
