import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;
export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({ count, initial = 1 }: { count: number; initial?: number }) {
  const [page, setPage] = useState(initial);
  return <Pagination count={count} page={page} onPageChange={setPage} />;
}

export const Default: Story = {
  args: { count: 10, page: 1 },
  render: (args) => <Controlled count={args.count} initial={args.page} />,
};

export const Showcase: Story = {
  args: { count: 20, page: 6 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Controlled count={5} />
      <Controlled count={20} initial={6} />
      <Controlled count={20} initial={20} />
      <Pagination count={10} page={3} disabled />
    </div>
  ),
};
