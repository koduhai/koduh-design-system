import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TimePicker } from './TimePicker';
import { FormField } from '../FormField';

const meta = { title: 'Components/TimePicker', component: TimePicker } satisfies Meta<
  typeof TimePicker
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Time' },
  render: function DefaultStory() {
    const [value, setValue] = useState<Date | null>(new Date(2024, 0, 1, 9, 30));
    return (
      <div style={{ padding: 40 }}>
        <TimePicker label="Time" value={value ?? undefined} onChange={setValue} />
      </div>
    );
  },
};

/** 12-hour mode adds an AM/PM segment; arrows or A/P toggle the period. */
export const TwelveHour: Story = {
  args: { label: 'Time' },
  render: function TwelveHourStory() {
    const [value, setValue] = useState<Date | null>(new Date(2024, 0, 1, 14, 15));
    return (
      <div style={{ padding: 40 }}>
        <TimePicker label="Time" hourCycle={12} value={value ?? undefined} onChange={setValue} />
      </div>
    );
  },
};

/** `withSeconds` adds a seconds segment; `minuteStep` controls arrow stepping. */
export const WithSeconds: Story = {
  args: { label: 'Duration' },
  render: function WithSecondsStory() {
    const [value, setValue] = useState<Date | null>(new Date(2024, 0, 1, 0, 5, 30));
    return (
      <div style={{ padding: 40 }}>
        <TimePicker label="Duration" withSeconds value={value ?? undefined} onChange={setValue} />
      </div>
    );
  },
};

/**
 * Inside a `<FormField>`: the field supplies the label, required indicator, and
 * error/aria wiring. The control is a `role="group"` of spinbutton segments, so
 * the error reaches AT via `aria-describedby` (not `aria-invalid` on the group).
 */
export const WithFormField: Story = {
  args: { label: 'Start time' },
  render: function WithFormFieldStory() {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <div style={{ padding: 40, maxWidth: 320 }}>
        <FormField label="Start time" required helperText="24-hour clock." id="start">
          <TimePicker value={value ?? undefined} onChange={setValue} />
        </FormField>
      </div>
    );
  },
};

export const Showcase: Story = {
  args: { label: 'Time' },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 40, flexWrap: 'wrap' }}>
      <TimePicker label="24-hour" defaultValue={new Date(2024, 0, 1, 9, 30)} />
      <TimePicker label="12-hour" hourCycle={12} defaultValue={new Date(2024, 0, 1, 14, 15)} />
      <TimePicker label="Seconds" withSeconds defaultValue={new Date(2024, 0, 1, 0, 5, 30)} />
      <TimePicker label="Error" error errorText="Required" />
      <TimePicker label="Disabled" disabled defaultValue={new Date(2024, 0, 1, 8, 0)} />
    </div>
  ),
};
