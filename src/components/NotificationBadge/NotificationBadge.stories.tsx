import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationBadge } from './NotificationBadge';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { BellIcon } from '../../icons';

const meta = {
  title: 'Components/NotificationBadge',
  component: NotificationBadge,
} satisfies Meta<typeof NotificationBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { count: 3, label: '3 unread notifications' },
  render: (args) => (
    <NotificationBadge {...args}>
      <Button variant="outline" tone="neutral" startIcon={<BellIcon />} aria-label="Notifications" />
    </NotificationBadge>
  ),
};

export const Showcase: Story = {
  args: { count: 3 },
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
      <NotificationBadge count={3} label="3 unread notifications">
        <Button
          variant="outline"
          tone="neutral"
          startIcon={<BellIcon />}
          aria-label="Notifications"
        />
      </NotificationBadge>

      <NotificationBadge count={150} max={99} label="99+ unread notifications">
        <Avatar name="Ada Lovelace" />
      </NotificationBadge>

      <NotificationBadge dot tone="success" label="Online">
        <Avatar name="Grace Hopper" />
      </NotificationBadge>

      <NotificationBadge count={8} tone="primary" placement="bottom-start" label="8 items">
        <Button variant="outline" tone="neutral" startIcon={<BellIcon />} aria-label="Cart" />
      </NotificationBadge>

      {/* Standalone */}
      <NotificationBadge count={12} tone="accent" label="12 results" />
    </div>
  ),
};
