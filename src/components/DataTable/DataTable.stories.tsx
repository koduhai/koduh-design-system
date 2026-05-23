import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
import type { DataColumn } from './types';

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
    empty: 'No team members match your filters.',
  },
};
