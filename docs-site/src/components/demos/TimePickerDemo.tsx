import { useState } from 'react';
import { TimePicker } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [value, setValue] = useState<Date | null>(() => new Date(2024, 0, 1, 9, 30));
  return <TimePicker label="Time" value={value ?? undefined} onChange={setValue} />;
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Type or arrow through hour / minute segments (24-hour)">
        <div style={{ ...col, maxWidth: 320 }}>
          <Basic />
        </div>
      </DemoBlock>
      <DemoBlock caption="12-hour mode and a seconds segment">
        <div style={{ display: 'flex', gap: 'var(--ku-space-5)', flexWrap: 'wrap' }}>
          <TimePicker label="12-hour" hourCycle={12} defaultValue={new Date(2024, 0, 1, 14, 15)} />
          <TimePicker
            label="With seconds"
            withSeconds
            defaultValue={new Date(2024, 0, 1, 0, 5, 30)}
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ display: 'flex', gap: 'var(--ku-space-5)', flexWrap: 'wrap' }}>
          <TimePicker label="Error" error errorText="Required" />
          <TimePicker label="Disabled" disabled defaultValue={new Date(2024, 0, 1, 8, 0)} />
        </div>
      </DemoBlock>
    </Demos>
  );
}
