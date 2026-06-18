import { useState } from 'react';
import { Popover, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      role="dialog"
      aria-label="Quick settings"
      trigger={
        <Button aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Open popover
        </Button>
      }
    >
      <div style={{ ...col, padding: 'var(--ku-space-2)', maxWidth: 240 }}>
        <strong>Quick settings</strong>
        <span style={{ color: 'var(--ku-color-fg-muted)' }}>
          Anchored floating content. Click the trigger again, press Esc, or click outside to close.
        </span>
      </div>
    </Popover>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Anchored popover">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
