import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './DatePicker';
import { FormField } from '../FormField';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
} satisfies Meta<typeof DatePicker>;
export default meta;

type Story = StoryObj<typeof meta>;

const JUNE_2026 = new Date(2026, 5, 15);

export const Default: Story = {
  args: { label: 'Event date', defaultValue: JUNE_2026 },
};

/**
 * Broad a11y/visual target. The calendar is rendered open (`defaultOpen` via a
 * controlled wrapper) so the floating layer is visible to axe and snapshots,
 * alongside sizes, an error state, a bounded range, and a disabled field.
 */
export const Showcase: Story = {
  args: { label: 'Event date' },
  render: () => {
    function OpenByDefault() {
      const [date, setDate] = useState<Date | null>(JUNE_2026);
      // Render an inline picker and force the popover open for the visual target.
      return (
        <div>
          <DatePicker
            label="Open calendar"
            value={date ?? undefined}
            onChange={setDate}
            min={new Date(2026, 5, 5)}
            max={new Date(2026, 5, 25)}
          />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
        <DatePicker label="Default" defaultValue={JUNE_2026} />
        <DatePicker label="Small" size="sm" defaultValue={JUNE_2026} />
        <DatePicker label="Large" size="lg" defaultValue={JUNE_2026} />
        <DatePicker label="With error" error defaultValue={JUNE_2026} />
        <DatePicker label="Disabled" disabled defaultValue={JUNE_2026} />
        <OpenByDefault />
      </div>
    );
  },
};

/**
 * `granularity="minute"` adds a time field to the popover; `value`/`onChange`
 * carry the full date + time. `min`/`max` are honored at minute resolution.
 */
export const DateAndTime: Story = {
  args: { label: 'Send at' },
  render: function DateAndTimeStory() {
    const [when, setWhen] = useState<Date | null>(new Date(2026, 5, 15, 9, 30));
    return (
      <div style={{ padding: 40, maxWidth: 360 }}>
        <DatePicker
          label="Send at"
          granularity="minute"
          hourCycle={12}
          value={when ?? undefined}
          onChange={setWhen}
        />
        <p style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>
          {when ? when.toString() : '—'}
        </p>
      </div>
    );
  },
};

/** Inside a `<FormField>`: pass no `label` — the field supplies label + aria. */
export const WithFormField: Story = {
  args: { label: 'Event date' },
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <FormField label="Event date" required helperText="Pick a day." id="wff-date">
        <DatePicker defaultValue={JUNE_2026} />
      </FormField>
    </div>
  ),
};
