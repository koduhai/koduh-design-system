import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from './Calendar';
import { KoduhI18nProvider } from '../../i18n';

// A fixed month so day cells are deterministic. June 2026 starts on a Monday.
const JUNE_2026 = new Date(2026, 5, 15);

/** Find a day button by its visible number within the grid. */
function day(n: number) {
  const grid = screen.getByRole('grid');
  return within(grid)
    .getAllByRole('gridcell')
    .find((el) => el.tagName === 'BUTTON' && el.textContent === String(n))!;
}

describe('Calendar', () => {
  it('renders a grid with weekday headers and day cells for the month', () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    // June has 30 days → 30 day buttons.
    const dayButtons = screen.getAllByRole('gridcell').filter((el) => el.tagName === 'BUTTON');
    expect(dayButtons).toHaveLength(30);
  });

  it('shows the month + year label and marks the selected day', () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    expect(day(15)).toHaveAttribute('aria-selected', 'true');
    expect(day(14)).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a day selects it (uncontrolled) and fires onChange', async () => {
    const onChange = vi.fn();
    render(<Calendar defaultValue={JUNE_2026} onChange={onChange} />);
    await userEvent.click(day(20));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as Date).getDate()).toBe(20);
    expect(day(20)).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled: selection is driven by the value prop', async () => {
    const onChange = vi.fn();
    render(<Calendar value={JUNE_2026} onChange={onChange} />);
    await userEvent.click(day(20));
    // onChange fires, but the displayed selection does not move without a prop update.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(day(15)).toHaveAttribute('aria-selected', 'true');
    expect(day(20)).toHaveAttribute('aria-selected', 'false');
  });

  it('controlled: updating value to a different month pages the grid to it', () => {
    const { rerender } = render(<Calendar value={JUNE_2026} />);
    expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    // Parent moves the controlled value to August 2026.
    rerender(<Calendar value={new Date(2026, 7, 9)} />);
    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
    expect(day(9)).toHaveAttribute('aria-selected', 'true');
    expect(day(9)).toHaveAttribute('tabindex', '0');
  });

  it('grid is labelled by the month heading rather than a duplicated aria-label', () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    const heading = screen.getByRole('heading', { name: /June 2026/ });
    expect(heading).toHaveAttribute('aria-level', '2');
    const grid = screen.getByRole('grid');
    expect(grid).not.toHaveAttribute('aria-label');
    expect(grid.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('previous/next month buttons change the displayed month', async () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    await userEvent.click(screen.getByLabelText('Next month'));
    expect(screen.getByText(/July 2026/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Previous month'));
    await userEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByText(/May 2026/)).toBeInTheDocument();
  });

  it('arrow keys move focus by day; Enter selects', async () => {
    const onChange = vi.fn();
    render(<Calendar defaultValue={JUNE_2026} onChange={onChange} />);
    day(15).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(day(16)).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}'); // +7 → 23
    expect(day(23)).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect((lastCall[0] as Date).getDate()).toBe(23);
  });

  it('Home/End move to the start/end of the week', async () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    // June 15 2026 is a Monday (weekday 1). Home → Sunday June 14, End → Saturday June 20.
    day(15).focus();
    await userEvent.keyboard('{Home}');
    expect(day(14)).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(day(20)).toHaveFocus();
  });

  it('PageUp/PageDown change the month', async () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    day(15).focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByText(/July 2026/)).toBeInTheDocument();
    await userEvent.keyboard('{PageUp}');
    await userEvent.keyboard('{PageUp}');
    expect(screen.getByText(/May 2026/)).toBeInTheDocument();
  });

  it('paging into a month moves roving focus to the first enabled day, not a disabled one', async () => {
    // August 2026 displayed; min is July 10, so July 1-9 are disabled.
    render(<Calendar defaultValue={new Date(2026, 7, 15)} min={new Date(2026, 6, 10)} />);
    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
    day(15).focus();
    await userEvent.keyboard('{PageUp}'); // → July 2026
    expect(screen.getByText(/July 2026/)).toBeInTheDocument();
    // Day 1 is disabled (before min); focus and tabindex land on the first enabled day, July 10.
    expect(day(1)).toBeDisabled();
    expect(day(10)).not.toBeDisabled();
    expect(day(10)).toHaveFocus();
    expect(day(10)).toHaveAttribute('tabindex', '0');
    expect(day(1)).toHaveAttribute('tabindex', '-1');
  });

  it('disables out-of-range days and refuses to select them', async () => {
    const onChange = vi.fn();
    render(
      <Calendar
        defaultValue={JUNE_2026}
        min={new Date(2026, 5, 10)}
        max={new Date(2026, 5, 20)}
        onChange={onChange}
      />,
    );
    expect(day(5)).toBeDisabled();
    expect(day(25)).toBeDisabled();
    expect(day(15)).not.toBeDisabled();
    await userEvent.click(day(5));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses roving tabindex — only the focus day is tabbable', () => {
    render(<Calendar defaultValue={JUNE_2026} />);
    expect(day(15)).toHaveAttribute('tabindex', '0');
    expect(day(14)).toHaveAttribute('tabindex', '-1');
  });

  describe('range mode', () => {
    it('first click sets the start; second click (after start) completes the range', async () => {
      const onChange = vi.fn();
      render(
        <Calendar mode="range" defaultValue={{ start: null, end: null }} onChange={onChange} />,
      );
      // Seed view to June 2026 by paging is unnecessary — default view is today's
      // month; drive selection by clicking days in whatever month is shown.
      await userEvent.click(day(10));
      expect(onChange).toHaveBeenLastCalledWith({ start: expect.any(Date), end: null });
      expect((onChange.mock.calls[0]![0] as { start: Date }).start.getDate()).toBe(10);
      await userEvent.click(day(15));
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as {
        start: Date;
        end: Date;
      };
      expect(last.start.getDate()).toBe(10);
      expect(last.end.getDate()).toBe(15);
    });

    it('highlights endpoints and the in-between days', () => {
      render(
        <Calendar
          mode="range"
          value={{ start: new Date(2026, 5, 10), end: new Date(2026, 5, 13) }}
          defaultValue={undefined}
        />,
      );
      expect(day(10)).toHaveAttribute('data-range-start', 'true');
      expect(day(13)).toHaveAttribute('data-range-end', 'true');
      expect(day(11)).toHaveAttribute('data-in-range', 'true');
      expect(day(12)).toHaveAttribute('data-in-range', 'true');
      expect(day(11)).toHaveAttribute('aria-selected', 'true');
      expect(day(9)).toHaveAttribute('aria-selected', 'false');
    });

    it('clicking a day before the pending start restarts the range from that day', async () => {
      const onChange = vi.fn();
      render(<Calendar mode="range" onChange={onChange} />);
      await userEvent.click(day(20));
      await userEvent.click(day(8)); // before the start → restart
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as {
        start: Date;
        end: Date | null;
      };
      expect(last.start.getDate()).toBe(8);
      expect(last.end).toBeNull();
    });

    it('clicking again after a complete range begins a fresh range', async () => {
      const onChange = vi.fn();
      render(<Calendar mode="range" onChange={onChange} />);
      await userEvent.click(day(10));
      await userEvent.click(day(15)); // complete
      await userEvent.click(day(20)); // fresh start
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as {
        start: Date;
        end: Date | null;
      };
      expect(last.start.getDate()).toBe(20);
      expect(last.end).toBeNull();
    });

    it('keyboard: Enter picks the start, then the end', async () => {
      const onChange = vi.fn();
      // Today is June 2026, so the default view shows June without a seed value.
      render(
        <Calendar mode="range" defaultValue={{ start: null, end: null }} onChange={onChange} />,
      );
      day(15).focus();
      await userEvent.keyboard('{Enter}'); // start = 15
      await userEvent.keyboard('{ArrowRight}{ArrowRight}'); // → 17
      await userEvent.keyboard('{Enter}'); // end = 17
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as {
        start: Date;
        end: Date;
      };
      expect(last.start.getDate()).toBe(15);
      expect(last.end.getDate()).toBe(17);
    });
  });

  describe('i18n', () => {
    it('formats the month label in English by default (no provider)', () => {
      render(<Calendar defaultValue={JUNE_2026} />);
      expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    });

    it('falls back to the provider locale for Intl formatting', () => {
      render(
        <KoduhI18nProvider locale="fr-FR">
          <Calendar defaultValue={JUNE_2026} />
        </KoduhI18nProvider>,
      );
      // French month name for June is "juin"; the heading uses the provider locale.
      expect(screen.getByText(/juin 2026/)).toBeInTheDocument();
    });

    it('the locale prop overrides the provider locale', () => {
      render(
        <KoduhI18nProvider locale="fr-FR">
          <Calendar defaultValue={JUNE_2026} locale="en-US" />
        </KoduhI18nProvider>,
      );
      // Prop (en-US) wins over the provider (fr-FR).
      expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    });
  });
});
