import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from './Meter';

const meta = {
  title: 'Components/Meter',
  component: Meter,
} satisfies Meta<typeof Meter>;
export default meta;

type Story = StoryObj<typeof meta>;

const pct = (v: number) => `${v}%`;

export const Default: Story = {
  args: { value: 30, label: 'Disk usage', formatValue: pct, showValue: true },
};

export const Showcase: Story = {
  args: { value: 30, label: 'Disk usage' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      {/* lower-is-better: optimum below low. */}
      <Meter label="Disk (good)" value={20} low={50} high={80} optimum={10} formatValue={pct} showValue />
      <Meter
        label="Disk (caution)"
        value={65}
        low={50}
        high={80}
        optimum={10}
        formatValue={pct}
        showValue
      />
      <Meter label="Disk (poor)" value={92} low={50} high={80} optimum={10} formatValue={pct} showValue />
      {/* No thresholds → neutral. */}
      <Meter label="Battery (neutral)" value={64} formatValue={pct} showValue />
      {/* higher-is-better: optimum above high. */}
      <Meter label="Score" value={88} min={0} max={100} low={40} high={70} optimum={100} formatValue={pct} showValue />
      <Meter label="Thin track" value={45} size="sm" formatValue={pct} showValue />
    </div>
  ),
};
