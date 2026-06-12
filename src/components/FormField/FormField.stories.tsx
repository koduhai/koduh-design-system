import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import { useFieldContext } from './useField';

const meta = {
  title: 'Components/FormField',
  component: FormField,
} satisfies Meta<typeof FormField>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A bare custom control that wires itself via the FormField context. */
function CustomInput({ placeholder }: { placeholder?: string }) {
  const { id, describedById, invalid, required } = useFieldContext();
  return (
    <input
      id={id}
      placeholder={placeholder}
      aria-describedby={describedById}
      aria-invalid={invalid || undefined}
      required={required}
      style={{
        font: 'inherit',
        padding: 'var(--ku-space-2) var(--ku-space-3)',
        border: `1px solid ${invalid ? 'var(--ku-color-danger)' : 'var(--ku-color-border)'}`,
        borderRadius: 'var(--ku-radius-md)',
        background: 'var(--ku-color-bg-default)',
        color: 'var(--ku-color-text-primary)',
      }}
    />
  );
}

export const Default: Story = {
  args: {
    label: 'Username',
    helperText: 'Pick something memorable.',
    children: <CustomInput placeholder="Type here" />,
  },
};

export const Showcase: Story = {
  args: { label: 'Showcase', children: <CustomInput /> },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <FormField label="Email address" helperText="We never share it.">
        <CustomInput placeholder="you@example.com" />
      </FormField>
      <FormField label="Display name" required>
        <CustomInput placeholder="Required field" />
      </FormField>
      <FormField label="Age" error errorText="Please enter a valid age.">
        <CustomInput placeholder="0" />
      </FormField>
    </div>
  ),
};
