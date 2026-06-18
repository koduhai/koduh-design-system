import { useState } from 'react';
import { Popconfirm, Button } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

function Basic() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ku-space-3)' }}>
      <Popconfirm
        title="Delete item?"
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={() => setCount((c) => c + 1)}
        trigger={
          <Button tone="danger" variant="outline">
            Delete
          </Button>
        }
      >
        This permanently removes the item. Are you sure?
      </Popconfirm>
      <span style={{ color: 'var(--ku-color-fg-muted)' }}>Confirmed {count} time(s)</span>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Confirm a destructive action inline">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
