import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta = {
  title: 'Components/Slider',
  component: Slider,
} satisfies Meta<typeof Slider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Volume', defaultValue: 30 },
};

export const Showcase: Story = {
  args: { label: 'Volume', defaultValue: 30 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 320 }}>
      <Slider label="Volume" defaultValue={40} />
      <Slider label="Brightness" defaultValue={75} formatValue={(v) => `${v}%`} />
      <Slider label="Disabled level" defaultValue={50} disabled />
    </div>
  ),
};
