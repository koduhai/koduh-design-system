import { useState } from 'react';
import { Switch } from '@koduhai/design-system';
import { DemoBlock, Demos, col, row } from './_kit';

function Basic() {
  const [on, setOn] = useState(true);
  return (
    <div style={{ ...col, alignItems: 'flex-start' }}>
      <Switch label="Wi-Fi" checked={on} onChange={setOn} />
      <Switch label="Off" defaultChecked={false} />
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="States">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Sizes">
        <div style={row}>
          <Switch label="Small" size="sm" defaultChecked />
          <Switch label="Medium" size="md" defaultChecked />
          <Switch label="Large" size="lg" defaultChecked />
        </div>
      </DemoBlock>
    </Demos>
  );
}
