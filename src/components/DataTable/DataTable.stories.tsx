import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
import type { DataColumn, DataTableState } from './types';

interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
  joined: string;
}

const people: Person[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  name: ['Ann', 'Bob', 'Cy', 'Dee', 'Eli'][i % 5] + ` ${i + 1}`,
  role: i % 2 ? 'admin' : 'user',
  age: 22 + (i % 20),
  joined: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
}));

const columns: DataColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'role', header: 'Role', sortable: true, filter: 'select' },
  {
    key: 'age',
    header: 'Age',
    type: 'number',
    align: 'end',
    sortable: true,
    filter: 'number-range',
  },
  { key: 'joined', header: 'Joined', type: 'date', sortable: true, filter: 'date-range' },
];

const meta = {
  title: 'Components/DataTable',
  component: DataTable<Person>,
} satisfies Meta<typeof DataTable<Person>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  args: { columns, data: people, getRowId: (r: Person) => r.id, caption: 'Team members' },
};

/**
 * `virtualized`: for very large client-side datasets, the full sorted/filtered
 * result is windowed inside a fixed-height scroll viewport (only the visible rows
 * mount) instead of paginating. Requires a fixed `rowHeight`. Sort, search,
 * selection, and a sticky header all still work; `aria-rowcount`/`aria-rowindex`
 * keep the true row count for assistive tech.
 */
const manyPeople: Person[] = Array.from({ length: 1000 }, (_, i) => ({
  id: String(i + 1),
  name: ['Ann', 'Bob', 'Cy', 'Dee', 'Eli'][i % 5] + ` ${i + 1}`,
  role: i % 2 ? 'admin' : 'user',
  age: 22 + (i % 40),
  joined: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
}));

export const Virtualized: Story = {
  args: {
    columns,
    data: manyPeople,
    getRowId: (r: Person) => r.id,
    virtualized: true,
    rowHeight: 44,
    viewportHeight: 360,
    stickyHeader: true,
    caption: '1,000 team members (virtualized)',
  },
};

export const WithSelection: Story = {
  args: {
    columns,
    data: people,
    getRowId: (r: Person) => r.id,
    defaultSelectedIds: ['1', '2', '3'],
  },
};

export const Loading: Story = {
  args: { columns, data: [], getRowId: (r: Person) => r.id, loading: true },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    getRowId: (r: Person) => r.id,
    empty: 'No team members yet.',
  },
};

// `empty` distinguishes a genuinely empty dataset from a filter/search miss:
// pass a function to vary the copy, or use the `noResults` slot for the miss.
export const EmptyVsNoResults: Story = {
  args: {
    columns,
    data: people,
    getRowId: (r: Person) => r.id,
    defaultSearch: 'no-such-person',
    empty: ({ isFiltered }) =>
      isFiltered ? 'No matches — try clearing your filters.' : 'No team members yet.',
    noResults: 'No matches — try clearing your filters.',
  },
};

// Each row gets an expand toggle revealing a detail panel that spans every
// column. Expanded state is uncontrolled here (see `expandedIds` for control).
export const Expandable: Story = {
  args: {
    columns,
    data: people,
    getRowId: (r: Person) => r.id,
    caption: 'Team members (expandable)',
    defaultExpandedIds: ['1'],
    renderExpanded: (r: Person) => (
      <dl
        style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem' }}
      >
        <dt style={{ fontWeight: 600 }}>Name</dt>
        <dd style={{ margin: 0 }}>{r.name}</dd>
        <dt style={{ fontWeight: 600 }}>Role</dt>
        <dd style={{ margin: 0 }}>{r.role}</dd>
        <dt style={{ fontWeight: 600 }}>Joined</dt>
        <dd style={{ margin: 0 }}>{r.joined}</dd>
      </dl>
    ),
  },
};

// Opt-in resizable columns: each header carries a keyboard-operable separator
// (ArrowLeft/ArrowRight). The `joined` column opts out via `resizable: false`.
export const ResizableColumns: Story = {
  args: {
    columns: columns.map((c) => (c.key === 'joined' ? { ...c, resizable: false } : c)),
    data: people,
    getRowId: (r: Person) => r.id,
    caption: 'Resizable columns',
    resizableColumns: true,
    defaultColumnWidths: { name: 220, role: 120 },
  },
};

// Server-side / manual mode: the parent owns sort/filter/pagination via
// `onStateChange` and supplies the already-processed page + `rowCount`.
export const ServerSide: Story = {
  args: { columns, data: people, getRowId: (r: Person) => r.id },
  render: () => {
    const ServerSideDemo = () => {
      const all = people;
      const [tableState, setTableState] = useState<DataTableState>({
        sort: [],
        filters: {},
        search: '',
        page: 1,
        pageSize: 10,
      });
      // Emulate a backend: sort + slice here instead of inside the table.
      const sorted = [...all].sort((a, b) => {
        const rule = tableState.sort[0];
        if (!rule) return 0;
        const av = a[rule.key as keyof Person];
        const bv = b[rule.key as keyof Person];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return rule.dir === 'desc' ? -cmp : cmp;
      });
      const start = (tableState.page - 1) * tableState.pageSize;
      const pageRows = sorted.slice(start, start + tableState.pageSize);
      return (
        <DataTable
          columns={columns.map((c) => ({ ...c, filter: undefined }))}
          data={pageRows}
          getRowId={(r) => r.id}
          caption="Server-side data (manual)"
          manual
          rowCount={all.length}
          searchable={false}
          onStateChange={setTableState}
        />
      );
    };
    return <ServerSideDemo />;
  },
};
