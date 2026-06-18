import { useState } from 'react';
import { DatePicker } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [date, setDate] = useState<Date | null>(() => new Date(2026, 5, 15));
  return <DatePicker label="Event date" value={date ?? undefined} onChange={setDate} />;
}

function DateTime() {
  const [when, setWhen] = useState<Date | null>(() => new Date(2026, 5, 15, 9, 30));
  return (
    <div style={col}>
      <DatePicker
        label="Send at"
        granularity="minute"
        hourCycle={12}
        value={when ?? undefined}
        onChange={setWhen}
      />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>
        {when ? when.toString() : '–'}
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Pick a day from the calendar popover">
        <div style={{ ...col, maxWidth: 320 }}>
          <Basic />
        </div>
      </DemoBlock>
      <DemoBlock caption="granularity='minute' adds a time field (date + time)">
        <div style={{ ...col, maxWidth: 320 }}>
          <DateTime />
        </div>
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ ...col, maxWidth: 320 }}>
          <DatePicker label="With error" error defaultValue={new Date(2026, 5, 15)} />
          <DatePicker label="Disabled" disabled defaultValue={new Date(2026, 5, 15)} />
        </div>
      </DemoBlock>
    </Demos>
  );
}
