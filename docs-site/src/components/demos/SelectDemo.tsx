import { useState } from 'react';
import { Select } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

function Single() {
  const [value, setValue] = useState<string>();
  return (
    <Select
      label="Country"
      options={options}
      placeholder="Choose a country"
      value={value}
      onChange={(v) => setValue(v)}
      clearable
    />
  );
}

function Multi() {
  const [value, setValue] = useState<string[]>(['us', 'ca']);
  return (
    <Select
      multiple
      label="Countries"
      options={options}
      placeholder="Choose countries"
      value={value}
      onChange={setValue}
      clearable
    />
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Single select (clearable)">
        <div style={{ ...col, maxWidth: 320 }}>
          <Single />
        </div>
      </DemoBlock>
      <DemoBlock caption="Multiple: selected values render as removable chips">
        <div style={{ ...col, maxWidth: 360 }}>
          <Multi />
        </div>
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ display: 'flex', gap: 'var(--ku-space-4)', flexWrap: 'wrap' }}>
          <Select label="Error" options={options} error helperText="Required" />
          <Select label="Disabled" options={options} disabled placeholder="Choose…" />
          <Select label="Compact" options={options} density="compact" placeholder="Choose…" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
