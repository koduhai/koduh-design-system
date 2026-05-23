import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';
import { SearchIcon } from '../../icons';

const meta = {
  title: 'Components/TextField',
  component: TextField,
} satisfies Meta<typeof TextField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Email', placeholder: 'you@example.com' } };

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
    </div>
  ),
};
