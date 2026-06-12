import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from '../Calendar';
import { FormField } from '../FormField';

const meta = { title: 'Components/DateRangePicker', component: DateRangePicker } satisfies Meta<
  typeof DateRangePicker
>;
export default meta;
type Story = StoryObj<typeof meta>;

const JUNE = (d: number) => new Date(2026, 5, d);

export const Default: Story = {
  args: { label: 'Trip dates' },
  render: function DefaultStory() {
    const [range, setRange] = useState<DateRange>({ start: JUNE(10), end: JUNE(16) });
    return (
      <div style={{ padding: 40 }}>
        <DateRangePicker label="Trip dates" value={range} onChange={setRange} />
      </div>
    );
  },
};

/**
 * Inside a `<FormField>`: the field supplies the label and error/aria wiring. The
 * control is a `role="group"` of two date fields, so the error reaches AT via
 * `aria-describedby`.
 */
export const WithFormField: Story = {
  args: { label: 'Trip dates' },
  render: function WithFormFieldStory() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    return (
      <div style={{ padding: 40, maxWidth: 420 }}>
        <FormField label="Trip dates" required helperText="Pick a start and end." id="trip">
          <DateRangePicker value={range} onChange={setRange} />
        </FormField>
      </div>
    );
  },
};

export const Showcase: Story = {
  args: { label: 'Trip dates' },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 40, maxWidth: 520 }}>
      <DateRangePicker label="Selected" defaultValue={{ start: JUNE(10), end: JUNE(16) }} />
      <DateRangePicker label="Empty" />
      <DateRangePicker label="Error" error defaultValue={{ start: JUNE(10), end: null }} />
      <DateRangePicker
        label="Disabled"
        disabled
        defaultValue={{ start: JUNE(10), end: JUNE(16) }}
      />
    </div>
  ),
};
