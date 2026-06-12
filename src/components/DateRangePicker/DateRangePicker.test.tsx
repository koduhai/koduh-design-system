import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from './DateRangePicker';
import { KoduhI18nProvider } from '../../i18n';
import { FormField } from '../FormField';

/** Find a day button by its visible number within the calendar grid. */
function day(n: number) {
  const grid = screen.getByRole('grid');
  return within(grid)
    .getAllByRole('gridcell')
    .find((el) => el.tagName === 'BUTTON' && el.textContent === String(n))!;
}

const fmt = (d: Date) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

describe('DateRangePicker', () => {
  it('renders start and end fields with placeholders, plus a calendar trigger', () => {
    render(<DateRangePicker label="Stay" />);
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'false');
  });

  it('reflects a controlled range in the two fields', () => {
    render(
      <DateRangePicker
        label="Stay"
        value={{ start: new Date(2026, 5, 10), end: new Date(2026, 5, 14) }}
      />,
    );
    expect(screen.getByLabelText('Start date')).toHaveValue(fmt(new Date(2026, 5, 10)));
    expect(screen.getByLabelText('End date')).toHaveValue(fmt(new Date(2026, 5, 14)));
  });

  it('picks a start then an end, closing once the range is complete', async () => {
    const onChange = vi.fn();
    render(<DateRangePicker label="Stay" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Open calendar'));
    await userEvent.click(day(10)); // start
    expect(onChange).toHaveBeenLastCalledWith({ start: expect.any(Date), end: null });
    // Still open after the first pick.
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(day(15)); // end
    const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as {
      start: Date;
      end: Date;
    };
    expect(last.start.getDate()).toBe(10);
    expect(last.end.getDate()).toBe(15);
    // Closed once complete.
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'false');
  });

  it('Backspace on a field clears the whole range', async () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="Stay"
        value={{ start: new Date(2026, 5, 10), end: new Date(2026, 5, 14) }}
        onChange={onChange}
      />,
    );
    const start = screen.getByLabelText('Start date');
    start.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith({ start: null, end: null });
  });

  it('inside FormField: defers the accessible name to the field; error via aria-describedby', () => {
    render(
      <FormField label="Trip dates" error errorText="Pick a range" id="trip">
        <DateRangePicker />
      </FormField>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby', screen.getByText('Trip dates').id);
    expect(group).not.toHaveAttribute('aria-invalid');
    expect(group.getAttribute('aria-describedby')).toContain(screen.getByText('Pick a range').id);
  });

  it('does not open when disabled', async () => {
    render(<DateRangePicker label="Stay" disabled />);
    const trigger = screen.getByLabelText('Open calendar');
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the accessible name stable when the placeholder is customized', () => {
    render(
      <DateRangePicker label="Stay" startPlaceholder="mm/dd/yyyy" endPlaceholder="mm/dd/yyyy" />,
    );
    // The accessible name comes from the dedicated label, not the placeholder.
    expect(screen.getByLabelText('Start date')).toHaveAttribute('placeholder', 'mm/dd/yyyy');
    expect(screen.getByLabelText('End date')).toHaveAttribute('placeholder', 'mm/dd/yyyy');
  });

  it('accepts startLabel/endLabel prop overrides for the accessible name', () => {
    render(<DateRangePicker label="Stay" startLabel="Check-in" endLabel="Check-out" />);
    expect(screen.getByLabelText('Check-in')).toBeInTheDocument();
    expect(screen.getByLabelText('Check-out')).toBeInTheDocument();
  });

  it('i18n: flows provider overrides through to labels, placeholders, and the dialog label', async () => {
    render(
      <KoduhI18nProvider
        messages={{
          dateRangePicker: {
            startLabel: 'Début',
            endLabel: 'Fin',
            startPlaceholder: 'jj/mm/aaaa',
            endPlaceholder: 'jj/mm/aaaa',
            dialogLabel: 'Plage',
          },
        }}
      >
        <DateRangePicker label="Séjour" />
      </KoduhI18nProvider>,
    );
    expect(screen.getByLabelText('Début')).toBeInTheDocument();
    expect(screen.getByLabelText('Fin')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('dialog', { name: 'Plage' })).toBeInTheDocument();
  });
});
