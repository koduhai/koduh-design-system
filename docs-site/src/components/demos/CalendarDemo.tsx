import { useState } from 'react';
import { Calendar } from '@koduhai/design-system';
import type { DateRange } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Single() {
  const [date, setDate] = useState<Date>(() => new Date(2026, 5, 15));
  return (
    <div style={col}>
      <Calendar value={date} onChange={setDate} />
      <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>
        Selected: {date.toDateString()}
      </span>
    </div>
  );
}

function Range() {
  const [range, setRange] = useState<DateRange>(() => ({
    start: new Date(2026, 5, 10),
    end: new Date(2026, 5, 16),
  }));
  return (
    <div style={col}>
      <Calendar mode="range" value={range} onChange={setRange} />
      <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>
        {range.start?.toDateString() ?? '–'} → {range.end?.toDateString() ?? '–'}
      </span>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Single-date selection">
        <Single />
      </DemoBlock>
      <DemoBlock caption="mode='range': pick a start, then an end">
        <Range />
      </DemoBlock>
      <DemoBlock caption="Bounded by min / max (out-of-range days disabled)">
        <Calendar
          defaultValue={new Date(2026, 5, 15)}
          min={new Date(2026, 5, 8)}
          max={new Date(2026, 5, 22)}
        />
      </DemoBlock>
    </Demos>
  );
}
