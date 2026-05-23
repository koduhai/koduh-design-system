import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from './Popover';
import { Button } from '../Button';

const meta = {
  title: 'Components/Popover',
  component: Popover,
} satisfies Meta<typeof Popover>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: <Button>Open</Button>, children: null },
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 80 }}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          role="dialog"
          trigger={<Button onClick={() => setOpen((o) => !o)}>Toggle popover</Button>}
        >
          <div style={{ padding: 16, maxWidth: 240 }}>Anchored content.</div>
        </Popover>
      </div>
    );
  },
};

export const Showcase: Story = {
  args: { trigger: <Button>Anchor</Button>, children: null },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 120 }}>
      <Popover open onOpenChange={() => {}} role="dialog" trigger={<Button>Anchor</Button>}>
        <div style={{ padding: 16, maxWidth: 260 }}>
          This popover is rendered open for accessibility and visual testing.
        </div>
      </Popover>
    </div>
  ),
};
