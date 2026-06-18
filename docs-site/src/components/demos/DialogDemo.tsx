import { useState } from 'react';
import { Dialog, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

function Basic() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project"
        footer={
          <div style={row}>
            <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </div>
        }
      >
        This action cannot be undone. The project and all of its data will be permanently removed.
      </Dialog>
    </>
  );
}

function Sizes() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
  return (
    <>
      <div style={row}>
        <Button variant="outline" onClick={() => setSize('sm')}>
          Small
        </Button>
        <Button variant="outline" onClick={() => setSize('md')}>
          Medium
        </Button>
        <Button variant="outline" onClick={() => setSize('lg')}>
          Large
        </Button>
      </div>
      <Dialog
        open={size !== null}
        onOpenChange={() => setSize(null)}
        size={size ?? 'md'}
        title={`${size ?? ''} dialog`.trim()}
      >
        A {size} dialog showing how the width preset changes the surface size.
      </Dialog>
    </>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Dialog with footer actions">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Size presets">
        <Sizes />
      </DemoBlock>
    </Demos>
  );
}
