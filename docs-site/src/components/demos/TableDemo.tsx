import { useState } from 'react';
import { Table, EmptyState } from '@koduhai/design-system';
import type { Column, SortDirection } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

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
    />
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Sortable + selectable">
        <div style={{ width: '100%' }}>
          <Interactive />
        </div>
      </DemoBlock>
      <DemoBlock caption="Empty and compact density">
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ku-space-6)',
          }}
        >
          <Table
            columns={columns}
            data={[]}
            getRowId={(u) => u.id}
            empty={<EmptyState title="No members yet" />}
          />
          <Table
            columns={columns}
            data={users}
            getRowId={(u) => u.id}
            caption="Compact density"
            captionVisible
            density="compact"
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
