import { test, expect } from 'vitest';
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
  expect(screen.getByText('1')).toBeInTheDocument(); // priority badge for Name
  expect(screen.getByText('2')).toBeInTheDocument(); // priority badge for Age
});
