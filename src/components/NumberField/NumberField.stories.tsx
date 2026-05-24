import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberField } from './NumberField';

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
} satisfies Meta<typeof NumberField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Quantity', defaultValue: 1 } };

export const Showcase: Story = {
  args: { label: 'Default quantity' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <NumberField label="Default quantity" defaultValue={1} />
      <NumberField
        label="Bounded amount"
        defaultValue={5}
        min={0}
        max={10}
        step={1}
        helperText="Between 0 and 10."
      />
      <NumberField label="Invalid count" defaultValue={0} error errorText="Must be at least 1." />
      <NumberField label="Disabled total" defaultValue={42} disabled />
    </div>
  ),
};
