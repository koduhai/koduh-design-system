import { useState } from 'react';
import { Checkbox } from '@koduhai/design-system';
import { DemoBlock, Demos, col, row } from './_kit';

function Basic() {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ ...col, alignItems: 'flex-start' }}>
      <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="States">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Error">
        <div style={{ ...col, alignItems: 'flex-start' }}>
          <Checkbox label="Error" error />
          <Checkbox label="Error checked" error defaultChecked />
        </div>
      </DemoBlock>
      <DemoBlock caption="Sizes">
        <div style={row}>
          <Checkbox label="Small" size="sm" defaultChecked />
          <Checkbox label="Medium" size="md" defaultChecked />
          <Checkbox label="Large" size="lg" defaultChecked />
        </div>
      </DemoBlock>
    </Demos>
  );
}
