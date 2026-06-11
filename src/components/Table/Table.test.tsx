import { describe, it, expect, vi, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from './Table';
import type { Column, SortRule } from './Table';

interface User {
  id: string;
  name: string;
  role: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada', role: 'Engineer' },
  { id: 'u2', name: 'Linus', role: 'Maintainer' },
];

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
];

const base = {
  columns,
  data: users,
  getRowId: (u: User) => u.id,
};

describe('Table', () => {
  it('renders headers and rows from columns + data', () => {
    render(<Table {...base} caption="Users" />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Maintainer' })).toBeInTheDocument();
  });

  it('uses a custom render function for a column', () => {
    const cols: Column<User>[] = [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role', render: (u) => <em>{u.role.toUpperCase()}</em> },
    ];
    render(<Table columns={cols} data={users} getRowId={(u) => u.id} />);
    expect(screen.getByText('ENGINEER')).toBeInTheDocument();
  });

  it('emits onSortChange with a toggled direction from a sortable header', async () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<Table {...base} onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc', expect.anything());
    rerender(<Table {...base} sortKey="name" sortDir="asc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith('name', 'desc', expect.anything());
    rerender(<Table {...base} sortKey="name" sortDir="desc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith('name', 'asc', expect.anything());
  });

  it('does not render a no-op sort control or aria-sort when onSortChange is omitted', () => {
    // `sortable: true` but no handler: the header must not advertise a dead interaction.
    render(<Table {...base} />);
    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(screen.queryByRole('button', { name: /Name/ })).toBeNull();
  });

  it('reflects sort state via aria-sort on the active header', () => {
    render(<Table {...base} sortKey="name" sortDir="asc" onSortChange={() => {}} />);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('renders a selection column and toggles a single row', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...base} selectedIds={[]} onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row u1' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['u1']);
  });

  it('select-all toggles every row id', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...base} selectedIds={[]} onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['u1', 'u2']);
  });

  it('marks the select-all checkbox indeterminate when some rows are selected', () => {
    render(<Table {...base} selectedIds={['u1']} onSelectionChange={() => {}} />);
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' }) as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(true);
  });

  it('sets the sticky data attribute when stickyHeader is enabled', () => {
    const { container } = render(<Table {...base} stickyHeader />);
    expect(container.querySelector('table')).toHaveAttribute('data-sticky', 'true');
  });

  it('renders skeleton rows while loading', () => {
    const { container } = render(<Table {...base} loading loadingRows={3} />);
    // body rows = loadingRows; no data cell text present
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
    expect(screen.queryByText('Ada')).toBeNull();
  });

  it('renders the empty slot spanning all columns when there is no data', () => {
    render(<Table {...base} data={[]} empty={<div>No users</div>} />);
    const cell = screen.getByRole('cell', { name: 'No users' });
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('forwards a ref to the table element', () => {
    const ref = { current: null as HTMLTableElement | null };
    render(<Table {...base} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});

// ── New tests for multi-sort, event forwarding, and selectAllIds ────────────

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

test('header checkbox is indeterminate when only some of selectAllIds are selected', () => {
  render(
    <Table
      columns={cols}
      data={rows}
      getRowId={(r) => r.id}
      selectedIds={['1', '2']}
      onSelectionChange={() => {}}
      selectAllIds={['1', '2', '3']}
    />,
  );
  const selectAll = screen.getByRole('checkbox', { name: /select all/i }) as HTMLInputElement;
  // 2 of the 3 superset ids selected → indeterminate, NOT fully checked
  expect(selectAll).toHaveProperty('indeterminate', true);
  expect(selectAll).not.toBeChecked();
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

test('omits data-density by default and reflects density="compact"', () => {
  const { rerender } = render(<Table {...base} caption="Users" />);
  expect(screen.getByRole('table')).not.toHaveAttribute('data-density');
  rerender(<Table {...base} caption="Users" density="compact" />);
  expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
});
