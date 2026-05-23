import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Wi-Fi' } };

export const Showcase: Story = {
  args: { label: 'Wi-Fi' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch label="Off" defaultChecked={false} />
      <Switch label="On" defaultChecked />
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
      <Switch label="Small" size="sm" defaultChecked />
      <Switch label="Medium" size="md" defaultChecked />
      <Switch label="Large" size="lg" defaultChecked />
    </div>
  ),
};
