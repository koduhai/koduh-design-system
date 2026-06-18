import { useState } from 'react';
import { SplitButton, Text } from '@koduhai/design-system';
import type { MenuEntry } from '@koduhai/design-system';
import { DemoBlock, Demos, row, col } from './_kit';

export default function Demo() {
  const [last, setLast] = useState('nothing yet');
  const items: MenuEntry[] = [
    { label: 'Save as…', onSelect: () => setLast('Save as…') },
    { label: 'Save a copy', onSelect: () => setLast('Save a copy') },
  ];

  return (
    <Demos>
      <DemoBlock caption="tones · variants · sizes · disabled">
        <div style={row}>
          <SplitButton onClick={() => setLast('Save')} items={items} tone="primary">
            Save
          </SplitButton>
          <SplitButton
            onClick={() => setLast('Export')}
            items={items}
            tone="neutral"
            variant="outline"
          >
            Export
          </SplitButton>
          <SplitButton onClick={() => setLast('Delete')} items={items} tone="danger" size="sm">
            Delete
          </SplitButton>
          <SplitButton onClick={() => setLast('Disabled')} items={items} disabled>
            Disabled
          </SplitButton>
        </div>
      </DemoBlock>
      <DemoBlock caption="Interactive: primary action and menu both report">
        <div style={col}>
          <div style={row}>
            <SplitButton onClick={() => setLast('Save (primary)')} items={items} tone="primary">
              Save
            </SplitButton>
          </div>
          <Text tone="secondary" size="sm">
            Last action: {last}
          </Text>
        </div>
      </DemoBlock>
    </Demos>
  );
}
