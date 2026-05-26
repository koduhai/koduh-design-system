import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountUp } from './CountUp';

const meta = {
  title: 'Components/CountUp',
  component: CountUp,
} satisfies Meta<typeof CountUp>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: 1280 } };

export const Showcase: Story = {
  args: { value: 1280 },
  render: () => (
    <div style={{ display: 'flex', gap: 32, fontSize: 32, fontWeight: 700 }}>
      <CountUp value={1280} />
      <CountUp value={0.984} format={(n) => `${(n * 100).toFixed(1)}%`} />
      <CountUp value={4250} format={(n) => `$${Math.round(n).toLocaleString()}`} />
    </div>
  ),
};
