import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
} satisfies Meta<typeof StatusBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { status: 'active', label: 'Active' } };

export const Showcase: Story = {
  args: { status: 'active', label: 'Active' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <StatusBadge status="active" label="Active" />
      <StatusBadge status="inactive" label="Inactive" />
      <StatusBadge status="pending" label="Pending" />
      <StatusBadge status="error" label="Error" />
      <StatusBadge status="active" label="Active" variant="solid" />
      <StatusBadge status="inactive" label="Inactive" variant="solid" />
      <StatusBadge status="pending" label="Pending" variant="solid" />
      <StatusBadge status="error" label="Error" variant="solid" />
    </div>
  ),
};
