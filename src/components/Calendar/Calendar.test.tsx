import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from './Calendar';

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
});
