import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagInput } from './TagInput';
import { FormField } from '../FormField';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
} satisfies Meta<typeof TagInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Tags', defaultValue: ['react', 'typescript'], placeholder: 'Add a tag…' },
};

/**
 * Composed inside a `<FormField>`: the field owns the label, required marker, and
 * help/error text; TagInput defers its id/aria wiring to the field via context.
 */
export const WithFormField: Story = {
  args: { label: 'Tags' },
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <FormField
        label="Recipients"
        required
        id="recipients"
        helperText="Press Enter or comma to add an address."
      >
        <TagInput defaultValue={['a@example.com']} placeholder="Add a recipient…" />
      </FormField>
    </div>
  ),
};

export const Showcase: Story = {
  args: { label: 'Tags' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <TagInput
        label="Skills"
        defaultValue={['react', 'typescript', 'css']}
        helperText="Press Enter or comma to add."
      />
      <TagInput label="Topics" placeholder="Type a topic and press Enter" />
      <TagInput
        label="Recipients"
        defaultValue={['a@example.com']}
        error
        errorText="At least one recipient is required."
      />
    </div>
  ),
};
