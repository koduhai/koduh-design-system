import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';

const meta = {
  title: 'Components/Radio',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Plan', defaultValue: 'free' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>
  ),
};

export const Showcase: Story = {
  args: { label: 'Showcase' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <RadioGroup label="Vertical (default)" defaultValue="pro">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroup>

      <RadioGroup label="Horizontal" orientation="horizontal" defaultValue="m">
        <Radio value="s" label="Small" />
        <Radio value="m" label="Medium" />
        <Radio value="l" label="Large" />
      </RadioGroup>

      <RadioGroup label="With a disabled option" defaultValue="a">
        <Radio value="a" label="Available" />
        <Radio value="b" label="Also available" />
        <Radio value="c" label="Unavailable" disabled />
      </RadioGroup>
    </div>
  ),
};
