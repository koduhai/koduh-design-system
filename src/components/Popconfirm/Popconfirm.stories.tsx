import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popconfirm } from './Popconfirm';
import { Button } from '../Button';

const meta = {
  title: 'Components/Popconfirm',
  component: Popconfirm,
} satisfies Meta<typeof Popconfirm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <Button variant="outline">Archive</Button>,
    title: 'Archive this item?',
    children: 'You can restore it later from the archive.',
    onConfirm: () => {},
  },
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Popconfirm {...args} />
    </div>
  ),
};

/** A destructive confirmation uses `confirmTone="danger"`. */
export const Destructive: Story = {
  args: {
    trigger: <Button tone="danger">Delete</Button>,
    title: 'Delete this file?',
    children: 'This action cannot be undone.',
    confirmTone: 'danger',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  },
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Popconfirm {...args} />
    </div>
  ),
};

export const Showcase: Story = {
  args: { trigger: <Button>x</Button>, children: 'x', onConfirm: () => {} },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 80 }}>
      <Popconfirm
        trigger={<Button variant="outline">Archive</Button>}
        title="Archive this item?"
        onConfirm={() => {}}
      >
        You can restore it later from the archive.
      </Popconfirm>
      <Popconfirm
        trigger={<Button tone="danger">Delete</Button>}
        title="Delete this file?"
        confirmTone="danger"
        confirmLabel="Delete"
        onConfirm={() => {}}
      >
        This action cannot be undone.
      </Popconfirm>
    </div>
  ),
};
