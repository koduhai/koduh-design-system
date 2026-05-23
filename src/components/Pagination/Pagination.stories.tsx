import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;
export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({
  count,
  initial = 1,
  label,
}: {
  count: number;
  initial?: number;
  label?: string;
}) {
  const [page, setPage] = useState(initial);
  return <Pagination count={count} page={page} onPageChange={setPage} aria-label={label} />;
}

export const Default: Story = {
  args: { count: 10, page: 1 },
  render: (args) => <Controlled count={args.count} initial={args.page} />,
};

export const Showcase: Story = {
  args: { count: 20, page: 6 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Controlled count={5} label="Few pages" />
      <Controlled count={20} initial={6} label="Many pages, middle" />
      <Controlled count={20} initial={20} label="Many pages, last" />
      <Pagination count={10} page={3} disabled aria-label="Disabled pagination" />
    </div>
  ),
};
