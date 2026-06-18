import { useState } from 'react';
import { NumberField } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState<number | null>(1);
  return (
    <div style={{ ...col, maxWidth: 320 }}>
      <NumberField label="Quantity" value={v ?? undefined} onChange={setV} />
      <NumberField
        label="Bounded amount"
        defaultValue={5}
        min={0}
        max={10}
        step={1}
        helperText="Between 0 and 10."
      />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Steppers & bounds">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ ...col, maxWidth: 320 }}>
          <NumberField
            label="Invalid count"
            defaultValue={0}
            error
            errorText="Must be at least 1."
          />
          <NumberField label="Disabled total" defaultValue={42} disabled />
        </div>
      </DemoBlock>
    </Demos>
  );
}
