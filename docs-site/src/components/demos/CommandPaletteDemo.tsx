import { useState } from 'react';
import { CommandPalette, Button } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

function Basic() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('–');
  const run = (label: string) => () => setLast(label);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ku-space-3)' }}>
      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <span style={{ color: 'var(--ku-color-fg-muted)' }}>Last command: {last}</span>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={[
          { id: 'new', label: 'New file', group: 'File', onSelect: run('New file') },
          { id: 'open', label: 'Open file', group: 'File', onSelect: run('Open file') },
          {
            id: 'save',
            label: 'Save',
            group: 'File',
            keywords: 'write disk',
            onSelect: run('Save'),
          },
          { id: 'copy', label: 'Copy', group: 'Edit', onSelect: run('Copy') },
          { id: 'paste', label: 'Paste', group: 'Edit', onSelect: run('Paste') },
          { id: 'theme', label: 'Toggle theme', group: 'View', onSelect: run('Toggle theme') },
        ]}
      />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Searchable, grouped command menu">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
