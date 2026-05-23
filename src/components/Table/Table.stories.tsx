import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './Table';
import type { Column, SortDirection } from './Table';
import { EmptyState } from '../EmptyState';

interface User {
  id: string;
  name: string;
  role: string;
  status: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 'u2', name: 'Linus Torvalds', role: 'Maintainer', status: 'Active' },
  { id: 'u3', name: 'Grace Hopper', role: 'Admiral', status: 'Inactive' },
];

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'end' },
];

const meta = {
  title: 'Components/Table',
  component: Table<User>,
} satisfies Meta<typeof Table<User>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { columns, data: users, getRowId: (u: User) => u.id, caption: 'Team members' },
};

function Interactive() {
  const [sortKey, setSortKey] = useState<string | undefined>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<string[]>(['u1']);

  const sorted = [...users].sort((a, b) => {
    if (!sortKey) return 0;
    const av = String(a[sortKey as keyof User]);
    const bv = String(b[sortKey as keyof User]);
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <Table
      columns={columns}
      data={sorted}
      getRowId={(u) => u.id}
      caption="Team members"
      captionVisible
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(key, dir) => {
        setSortKey(key);
        setSortDir(dir);
      }}
      selectedIds={selected}
      onSelectionChange={setSelected}
      stickyHeader
    />
  );
}

export const Showcase: Story = {
  args: { columns, data: users, getRowId: (u: User) => u.id },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Interactive />
      <Table
        columns={columns}
        data={[]}
        getRowId={(u) => u.id}
        empty={<EmptyState title="No members yet" />}
      />
      <Table columns={columns} data={users} getRowId={(u) => u.id} loading loadingRows={3} />
    </div>
  ),
};
