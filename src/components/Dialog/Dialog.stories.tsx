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
  args: { open: true, onOpenChange: () => {} },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Dialog
            open={open}
            onOpenChange={() => setOpen(false)}
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
  args: { open: true, onOpenChange: () => {} },
  render: () => (
    <div style={{ minHeight: 480 }}>
      <Dialog
        open
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  ),
};

/**
 * Managed async confirm: `confirmLoading` keeps the dialog open with a spinner
 * on the confirm button (blocking re-confirm and dismissal) until the consumer
 * closes it once the work resolves. Also shows the `warning` tone.
 */
export const AsyncConfirm: Story = {
  args: { open: true, onOpenChange: () => {} },
  render: () => {
    const [open, setOpen] = useState(true);
    const [pending, setPending] = useState(false);
    return (
      <div style={{ minHeight: 320 }}>
        {!open ? <Button onClick={() => setOpen(true)}>Reopen</Button> : null}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          tone="warning"
          title="Archive conversation?"
          description="It will move to your archive. You can restore it later."
          confirmLabel="Archive"
          confirmLoading={pending}
          loadingText="Archiving…"
          onConfirm={() => {
            setPending(true);
            window.setTimeout(() => {
              setPending(false);
              setOpen(false);
            }, 1200);
          }}
        />
      </div>
    );
  },
};
