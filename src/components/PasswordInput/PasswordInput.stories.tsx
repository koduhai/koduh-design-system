import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
} satisfies Meta<typeof PasswordInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Password', defaultValue: 'hunter2' } };

export const Showcase: Story = {
  args: { label: 'Password' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <PasswordInput label="Password" defaultValue="hunter2" helperText="At least 8 characters." />
      <PasswordInput label="New password" />
      <PasswordInput label="Confirm" error errorText="Passwords don't match." defaultValue="x" />
      <PasswordInput label="Disabled" defaultValue="hunter2" disabled />
    </div>
  ),
};
