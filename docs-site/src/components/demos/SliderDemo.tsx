import { useState } from 'react';
import { Slider } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState(40);
  return (
    <div style={{ ...col, maxWidth: 320 }}>
      <Slider label="Volume" value={v} onChange={setV} />
      <Slider label="Brightness" defaultValue={75} formatValue={(n) => `${n}%`} />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Interactive">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ ...col, maxWidth: 320 }}>
          <Slider
            label="Threshold"
            helperText="Drag to set the alert threshold."
            defaultValue={20}
          />
          <Slider label="Disabled level" defaultValue={50} disabled />
          <Slider label="Budget" defaultValue={90} error errorText="Exceeds the allowed maximum." />
        </div>
      </DemoBlock>
    </Demos>
  );
}
