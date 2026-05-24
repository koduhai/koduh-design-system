import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './Calendar';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
} satisfies Meta<typeof Calendar>;
export default meta;

type Story = StoryObj<typeof meta>;

// A fixed reference month so visual baselines are deterministic.
const JUNE_2026 = new Date(2026, 5, 15);

export const Default: Story = {
  args: { defaultValue: JUNE_2026 },
};

/**
 * Broad a11y/visual target: a standalone calendar with a selected day, a
 * bounded range (some days disabled), and a controlled instance side-by-side.
 */
export const Showcase: Story = {
  args: { defaultValue: JUNE_2026 },
  render: () => {
    function Controlled() {
      const [date, setDate] = useState<Date>(JUNE_2026);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Calendar value={date} onChange={setDate} />
          <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>
            Selected: {date.toDateString()}
          </span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <Calendar defaultValue={JUNE_2026} />
        <Calendar defaultValue={JUNE_2026} min={new Date(2026, 5, 8)} max={new Date(2026, 5, 22)} />
        <Controlled />
      </div>
    );
  },
};

/** Right-to-left layout: logical CSS properties keep the grid correct. */
export const RTL: Story = {
  args: { defaultValue: JUNE_2026 },
  render: () => (
    <div dir="rtl">
      <Calendar defaultValue={JUNE_2026} locale="ar" />
    </div>
  ),
};
