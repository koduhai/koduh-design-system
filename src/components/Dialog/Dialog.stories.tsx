import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog } from './Dialog';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '../Button';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
} satisfies Meta<typeof Dialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: true, onClose: () => {} },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Edit profile"
            footer={
              <>
                <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Save</Button>
              </>
            }
          >
            Make changes to your profile here. Click save when you&rsquo;re done.
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};

export const Showcase: Story = {
  args: { open: true, onClose: () => {} },
  render: () => (
    <div style={{ minHeight: 480 }}>
      <Dialog
        open
        onClose={() => {}}
        title="Edit profile"
        footer={
          <>
            <Button variant="ghost" tone="neutral">
              Cancel
            </Button>
            <Button>Save</Button>
          </>
        }
      >
        Make changes to your profile here. Click save when you&rsquo;re done.
      </Dialog>
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  ),
};
