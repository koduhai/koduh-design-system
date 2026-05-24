import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionList } from './DescriptionList';

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
} satisfies Meta<typeof DescriptionList>;
export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  { term: 'Status', description: 'Active' },
  { term: 'Region', description: 'us-east-1' },
  { term: 'Plan', description: 'Enterprise' },
  { term: 'Owner', description: 'koduhai@koduhai.com' },
];

export const Default: Story = {
  args: { items },
};

export const Showcase: Story = {
  args: { items },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--ku-space-8)' }}>
      <DescriptionList items={items} />
      <DescriptionList items={items} termWidth="140px" />
    </div>
  ),
};
