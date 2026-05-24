import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from '../Button';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
} satisfies Meta<typeof Drawer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: false, onOpenChange: () => {} },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Drawer
          open={open}
          onOpenChange={setOpen}
          title="Filters"
          footer={<Button onClick={() => setOpen(false)}>Apply</Button>}
        >
          Drawer body content.
        </Drawer>
      </>
    );
  },
};

export const Showcase: Story = {
  args: { open: true, onOpenChange: () => {} },
  render: () => (
    <Drawer open onOpenChange={() => {}} title="Filters" side="end" footer={<Button>Apply</Button>}>
      Drawer body content for visual + a11y review.
    </Drawer>
  ),
};
