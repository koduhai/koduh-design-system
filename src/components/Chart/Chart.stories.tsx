import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chart } from './Chart';

const meta = {
  title: 'Components/Chart',
  component: Chart,
} satisfies Meta<typeof Chart>;
export default meta;

type Story = StoryObj<typeof meta>;

const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const Default: Story = {
  args: {
    series: [{ name: 'Signups', data: [12, 19, 14, 23, 21] }],
    categories,
    'aria-label': 'Weekly signups',
  },
};

export const Showcase: Story = {
  args: { series: [{ name: 'Signups', data: [12, 19, 14, 23, 21] }] },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>
          Multi-series line
        </span>
        <Chart
          type="line"
          categories={categories}
          series={[
            { name: 'Signups', data: [12, 19, 14, 23, 21] },
            { name: 'Active', data: [8, 11, 9, 15, 18] },
            { name: 'Churn', data: [3, 2, 4, 2, 1] },
          ]}
          aria-label="Signups, active, and churn over the week"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>Grouped bar</span>
        <Chart
          type="bar"
          categories={categories}
          series={[
            { name: 'Plan A', data: [12, 19, 14, 23, 21] },
            { name: 'Plan B', data: [8, 11, 9, 15, 18] },
          ]}
          aria-label="Plan A vs Plan B per day"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>
          No axes, custom color
        </span>
        <Chart
          type="line"
          showAxes={false}
          series={[
            { name: 'Latency', data: [40, 38, 52, 31, 45, 29], color: 'var(--ku-color-chart-7)' },
          ]}
          aria-label="Request latency"
        />
      </div>
    </div>
  ),
};
