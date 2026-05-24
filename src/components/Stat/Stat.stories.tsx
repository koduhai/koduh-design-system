import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from './Stat';
import { Card } from '../Card';

const meta = {
  title: 'Components/Stat',
  component: Stat,
} satisfies Meta<typeof Stat>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'MRR', value: '$48.2k', delta: '12%', trend: 'up', helpText: 'vs. last month' },
};

export const Showcase: Story = {
  args: { label: 'MRR', value: '$48.2k' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720 }}>
      <Card>
        <Stat label="MRR" value="$48.2k" delta="12%" trend="up" helpText="vs. last month" />
      </Card>
      <Card>
        <Stat label="Churn" value="2.1%" delta="0.4%" trend="down" helpText="vs. last month" />
      </Card>
      <Card>
        <Stat label="Active users" value="1,204" delta="0%" trend="neutral" />
      </Card>
    </div>
  ),
};
