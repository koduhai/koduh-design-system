import { useState } from 'react';
import { ToggleGroup } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const VIEW_ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

const FORMAT_ITEMS = [
  { value: 'bold', label: 'B' },
  { value: 'italic', label: 'I' },
  { value: 'underline', label: 'U' },
];

function Interactive() {
  const [single, setSingle] = useState('list');
  const [multi, setMulti] = useState<string[]>(['bold']);
  return (
    <div style={col}>
      <ToggleGroup
        type="single"
        items={VIEW_ITEMS}
        value={single}
        onChange={(v) => setSingle(v as string)}
        aria-label="View mode"
      />
      <ToggleGroup
        type="multiple"
        size="lg"
        items={FORMAT_ITEMS}
        value={multi}
        onChange={(v) => setMulti(v as string[])}
        aria-label="Text formatting"
      />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="single (default) · neutral size sm">
        <div style={col}>
          <ToggleGroup
            type="single"
            items={VIEW_ITEMS}
            defaultValue="list"
            aria-label="View mode"
          />
          <ToggleGroup
            type="single"
            tone="neutral"
            size="sm"
            items={VIEW_ITEMS}
            defaultValue="grid"
            aria-label="View mode small"
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="Interactive: single + multiple selection">
        <Interactive />
      </DemoBlock>
    </Demos>
  );
}
