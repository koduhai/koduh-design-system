import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from './Sparkline';

const meta = {
  title: 'Components/Sparkline',
  component: Sparkline,
} satisfies Meta<typeof Sparkline>;
export default meta;

type Story = StoryObj<typeof meta>;

const series = [4, 8, 6, 12, 9, 14, 11, 18, 16, 22];

export const Default: Story = {
  args: { data: series, 'aria-label': 'Weekly signups trend' },
};

export const Showcase: Story = {
  args: { data: series },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>line</span>
        <Sparkline data={series} type="line" aria-label="Line sparkline" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>area</span>
        <Sparkline data={series} type="area" aria-label="Area sparkline" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>bar</span>
        <Sparkline data={series} type="bar" aria-label="Bar sparkline" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>chart-3</span>
        <Sparkline
          data={series}
          type="area"
          color="var(--ku-color-chart-3)"
          aria-label="Amber area sparkline"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>inline</span>
        <span style={{ fontSize: 14 }}>
          Revenue{' '}
          <Sparkline
            data={series}
            width={64}
            height={18}
            color="var(--ku-color-chart-2)"
            aria-label="Revenue inline trend"
          />{' '}
          +22%
        </span>
      </div>
    </div>
  ),
};
