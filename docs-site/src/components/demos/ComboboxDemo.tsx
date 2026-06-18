import { useState } from 'react';
import { Combobox } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

function Single() {
  const [value, setValue] = useState<string>('us');
  return (
    <Combobox
      label="Country"
      options={options}
      placeholder="Search a country"
      value={value}
      onChange={(v) => setValue(v)}
      clearable
    />
  );
}

function Multi() {
  const [value, setValue] = useState<string[]>(['us', 'jp']);
  return (
    <Combobox
      label="Countries"
      multiple
      options={options}
      placeholder="Add countries"
      value={value}
      onChange={(v) => setValue(v)}
      clearable
    />
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Type to filter, then pick an option">
        <div style={{ ...col, maxWidth: 320 }}>
          <Single />
        </div>
      </DemoBlock>
      <DemoBlock caption="Multiple: chosen options become chips">
        <div style={{ ...col, maxWidth: 360 }}>
          <Multi />
        </div>
      </DemoBlock>
    </Demos>
  );
}
