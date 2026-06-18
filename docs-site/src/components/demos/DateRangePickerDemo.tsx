import { useState } from 'react';
import { DateRangePicker } from '@koduhai/design-system';
import type { DateRange } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [range, setRange] = useState<DateRange>(() => ({
    start: new Date(2026, 5, 10),
    end: new Date(2026, 5, 16),
  }));
  return (
    <div style={col}>
      <DateRangePicker label="Trip dates" value={range} onChange={setRange} />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>
        {range.start?.toDateString() ?? '–'} → {range.end?.toDateString() ?? '–'}
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Pick a start, then an end: the span fills in">
        <div style={{ ...col, maxWidth: 420 }}>
          <Basic />
        </div>
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ ...col, maxWidth: 420 }}>
          <DateRangePicker
            label="Error"
            error
            defaultValue={{ start: new Date(2026, 5, 10), end: null }}
          />
          <DateRangePicker
            label="Disabled"
            disabled
            defaultValue={{ start: new Date(2026, 5, 10), end: new Date(2026, 5, 16) }}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
