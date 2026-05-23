import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from './Table';
import type { Column } from './Table';

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
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
    rerender(<Table {...base} sortKey="name" sortDir="asc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith('name', 'desc');
    rerender(<Table {...base} sortKey="name" sortDir="desc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith('name', 'asc');
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
