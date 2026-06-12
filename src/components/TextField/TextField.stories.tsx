import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';
import { FormField } from '../FormField';
import { SearchIcon } from '../../icons';

const meta = {
  title: 'Components/TextField',
  component: TextField,
} satisfies Meta<typeof TextField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Email', placeholder: 'you@example.com' } };

/** When wrapped in a `<FormField>`, the field supplies the label, required marker, and aria wiring; `<TextField>` defers to it. */
export const WithFormField: Story = {
  args: { label: 'Email' },
  render: () => (
    <FormField label="Email" required helperText="We never share your email." id="ff-email">
      <TextField placeholder="you@example.com" />
    </FormField>
  ),
};

export const Showcase: Story = {
  args: { label: 'Default' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <TextField label="Default" placeholder="Type here" />
      <TextField label="With helper" helperText="We never share your email." placeholder="Email" />
      <TextField label="Required" required placeholder="Required field" />
      <TextField label="Invalid" error errorText="This field is required." />
      <TextField label="With icon" startAdornment={<SearchIcon size={16} />} placeholder="Search" />
      <TextField label="Small" size="sm" placeholder="sm" />
      <TextField label="Large" size="lg" placeholder="lg" />
      <TextField label="Compact density" density="compact" placeholder="compact" />
    </div>
  ),
};

/** `density="compact"` tightens the field padding/height for dense forms. */
export const Compact: Story = {
  args: { label: 'Compact', density: 'compact', placeholder: 'Tighter field' },
};
