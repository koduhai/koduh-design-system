import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberField } from './NumberField';
import { FormField } from '../FormField';

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

/**
 * Inside a `<FormField>`, NumberField defers its label, required indicator,
 * and aria wiring to the field — pass no `label` to the control.
 */
export const WithFormField: Story = {
  args: { label: 'Quantity' },
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <FormField label="Quantity" required helperText="How many units to order." id="wff-qty">
        <NumberField defaultValue={1} min={0} />
      </FormField>
    </div>
  ),
};
