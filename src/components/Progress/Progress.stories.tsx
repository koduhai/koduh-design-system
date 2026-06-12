import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Components/Progress',
  component: Progress,
} satisfies Meta<typeof Progress>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: 60, label: 'Uploading' } };

export const Showcase: Story = {
  args: { value: 60, label: 'Uploading' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <Progress value={25} label="Primary" showValue />
      <Progress value={50} tone="success" label="Success" showValue />
      <Progress value={75} tone="warning" label="Warning" size="lg" showValue />
      <Progress value={90} tone="danger" label="Danger" size="sm" />
      <Progress label="Indeterminate" />
    </div>
  ),
};
