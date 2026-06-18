import { useState } from 'react';
import { Menu, Button } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

function Basic() {
  const [last, setLast] = useState('–');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ku-space-3)' }}>
      <Menu
        trigger={<Button variant="outline">Actions</Button>}
        items={[
          { label: 'Edit', onSelect: () => setLast('Edit') },
          { label: 'Duplicate', onSelect: () => setLast('Duplicate') },
          { label: 'Archive', onSelect: () => setLast('Archive') },
          { type: 'separator' },
          { label: 'Delete', onSelect: () => setLast('Delete') },
          { label: 'Unavailable', onSelect: () => setLast('Unavailable'), disabled: true },
        ]}
      />
      <span style={{ color: 'var(--ku-color-fg-muted)' }}>Last action: {last}</span>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Action menu with a separator and a disabled item">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
