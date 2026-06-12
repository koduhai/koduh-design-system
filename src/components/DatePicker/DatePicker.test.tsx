import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from './DatePicker';
import { KoduhI18nProvider } from '../../i18n';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

const JUNE_2026 = new Date(2026, 5, 15);

/** Find a day button by its visible number within the calendar grid. */
function day(n: number) {
  const grid = screen.getByRole('grid');
  return within(grid)
    .getAllByRole('gridcell')
    .find((el) => el.tagName === 'BUTTON' && el.textContent === String(n))!;
}

describe('DatePicker', () => {
  it('renders a labelled text input formatted via Intl', () => {
    render(<DatePicker label="Event date" defaultValue={JUNE_2026} />);
    const input = screen.getByLabelText('Event date');
    expect(input).toHaveValue(
      new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(JUNE_2026),
    );
  });

  it('shows the placeholder when no date is selected', () => {
    render(<DatePicker label="Event date" placeholder="Pick one" />);
    expect(screen.getByLabelText('Event date')).toHaveAttribute('placeholder', 'Pick one');
    expect(screen.getByLabelText('Event date')).toHaveValue('');
  });

  it('opens the calendar from the trigger button', async () => {
    render(<DatePicker label="Event date" />);
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('selecting a day sets the value, closes, and fires onChange (uncontrolled)', async () => {
    const onChange = vi.fn();
    render(<DatePicker label="Event date" defaultValue={JUNE_2026} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Open calendar'));
    await userEvent.click(day(20));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as Date).getDate()).toBe(20);
    // Closed again.
    expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'false');
    // Input reflects the new value.
    expect(screen.getByLabelText('Event date')).toHaveValue(
      new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(2026, 5, 20)),
    );
  });

  it('controlled: value prop drives the displayed date', async () => {
    const onChange = vi.fn();
    render(<DatePicker label="Event date" value={JUNE_2026} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Open calendar'));
    await userEvent.click(day(20));
    expect(onChange).toHaveBeenCalledTimes(1);
    // Without a prop update the input keeps the controlled value.
    expect(screen.getByLabelText('Event date')).toHaveValue(
      new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(JUNE_2026),
    );
  });

  it('keyboard navigation in the open calendar selects a day', async () => {
    const onChange = vi.fn();
    render(<DatePicker label="Event date" defaultValue={JUNE_2026} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Open calendar'));
    day(15).focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect((lastCall[0] as Date).getDate()).toBe(16);
  });

  it('respects min/max — out-of-range days are disabled', async () => {
    render(
      <DatePicker
        label="Event date"
        defaultValue={JUNE_2026}
        min={new Date(2026, 5, 10)}
        max={new Date(2026, 5, 20)}
      />,
    );
    await userEvent.click(screen.getByLabelText('Open calendar'));
    expect(day(5)).toBeDisabled();
    expect(day(15)).not.toBeDisabled();
  });

  it('disabled: input and trigger are disabled and do not open', async () => {
    render(<DatePicker label="Event date" disabled defaultValue={JUNE_2026} />);
    expect(screen.getByLabelText('Event date')).toBeDisabled();
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });

  it('gives the popover dialog an accessible name', async () => {
    render(<DatePicker label="Event date" />);
    await userEvent.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
  });

  it('returns focus to the input when closed via Escape', async () => {
    render(<DatePicker label="Event date" />);
    const trigger = screen.getByLabelText('Open calendar');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('returns focus to the input when closed via outside click on dead space', async () => {
    render(
      <>
        <DatePicker label="Event date" />
        <div data-testid="outside">outside</div>
      </>,
    );
    const trigger = screen.getByLabelText('Open calendar');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByTestId('outside'));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('Backspace clears the selection and emits onChange(null) (uncontrolled)', async () => {
    const onChange = vi.fn();
    render(<DatePicker label="Event date" defaultValue={JUNE_2026} onChange={onChange} />);
    const input = screen.getByLabelText('Event date');
    expect(input).not.toHaveValue('');
    input.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toBeNull();
    expect(input).toHaveValue('');
  });

  it('Delete clears a Form-bound value via onChange(null)', async () => {
    const BOUND_DATE = new Date(2026, 5, 15);
    function Probe() {
      const f = useFormField('field');
      return <span data-testid="v">{f.value == null ? 'empty' : 'set'}</span>;
    }
    function Wrap() {
      const form = useForm({ defaultValues: { field: BOUND_DATE } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="field" label="Date">
            <DatePicker />
          </FormField>
          <Probe />
        </Form>
      );
    }
    render(<Wrap />);
    expect(screen.getByTestId('v')).toHaveTextContent('set');
    const input = screen.getByLabelText(/Date/);
    input.focus();
    await userEvent.keyboard('{Delete}');
    expect(screen.getByTestId('v')).toHaveTextContent('empty');
  });

  it('does not clear or emit when already empty', async () => {
    const onChange = vi.fn();
    render(<DatePicker label="Event date" onChange={onChange} />);
    const input = screen.getByLabelText('Event date');
    input.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('trigger aria-controls points at the role=dialog popover panel', async () => {
    render(<DatePicker label="Event date" />);
    const trigger = screen.getByLabelText('Open calendar');
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    const controls = trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(dialog.id).toBe(controls);
  });

  it('wires required + error aria standalone', () => {
    render(<DatePicker label="Event date" required error />);
    const input = screen.getByLabelText(/Event date/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  describe('i18n locale', () => {
    it('default (no provider) formats with the runtime locale, unchanged', () => {
      render(<DatePicker label="Event date" defaultValue={JUNE_2026} />);
      expect(screen.getByLabelText('Event date')).toHaveValue(
        new Intl.DateTimeFormat(undefined, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(JUNE_2026),
      );
    });

    it('the provider locale flows through to the formatted value', () => {
      render(
        <KoduhI18nProvider locale="fr-FR">
          <DatePicker label="Event date" defaultValue={JUNE_2026} />
        </KoduhI18nProvider>,
      );
      expect(screen.getByLabelText('Event date')).toHaveValue(
        new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(JUNE_2026),
      );
    });

    it('the locale prop overrides the provider locale', () => {
      render(
        <KoduhI18nProvider locale="fr-FR">
          <DatePicker label="Event date" defaultValue={JUNE_2026} locale="de-DE" />
        </KoduhI18nProvider>,
      );
      expect(screen.getByLabelText('Event date')).toHaveValue(
        new Intl.DateTimeFormat('de-DE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(JUNE_2026),
      );
    });
  });

  describe('DatePicker bound to a Form', () => {
    it('reads value from the form and writes day selection back', async () => {
      const BOUND_DATE = new Date(2026, 5, 15); // June 15 2026
      function Probe() {
        const f = useFormField('field');
        const d = f.value instanceof Date ? f.value.getDate() : null;
        return <span data-testid="v">{d}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: BOUND_DATE } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="Date">
              <DatePicker />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default shows in the input
      const input = screen.getByLabelText(/Date/);
      expect(input).toHaveValue(
        new Intl.DateTimeFormat(undefined, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(BOUND_DATE),
      );
      // open calendar and select day 20
      await userEvent.click(screen.getByLabelText('Open calendar'));
      const grid = screen.getByRole('grid');
      const day20 = within(grid)
        .getAllByRole('gridcell')
        .find((el) => el.tagName === 'BUTTON' && el.textContent === '20')!;
      await userEvent.click(day20);
      // form value updated
      expect(screen.getByTestId('v')).toHaveTextContent('20');
    });
  });

  it('inside FormField: no own label, input id + aria from context', () => {
    render(
      <FormField label="Event date" required error errorText="Bad" id="evt">
        <DatePicker />
      </FormField>,
    );
    const input = screen.getByLabelText(/Event date/);
    expect(input.id).toBe('evt');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Bad').id);
    // No duplicate label rendered by the control.
    expect(screen.getAllByText('Event date')).toHaveLength(1);
  });

  describe('date + time (granularity="minute")', () => {
    const fmtDT = (d: Date) =>
      new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }).format(d);

    it('day mode (default) renders no time field; minute mode does', async () => {
      const { rerender } = render(<DatePicker label="When" />);
      await userEvent.click(screen.getByLabelText('Open calendar'));
      expect(screen.queryByRole('spinbutton', { name: 'Hour' })).toBeNull();
      rerender(<DatePicker label="When" granularity="minute" />);
      expect(screen.getByRole('spinbutton', { name: 'Hour' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('formats the input with date and time', () => {
      const when = new Date(2026, 5, 15, 14, 30);
      render(<DatePicker label="When" granularity="minute" defaultValue={when} />);
      expect(screen.getByLabelText('When')).toHaveValue(fmtDT(when));
    });

    it('selecting a day preserves the time and keeps the popover open', async () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          label="When"
          granularity="minute"
          defaultValue={new Date(2026, 5, 15, 14, 30)}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('Open calendar'));
      await userEvent.click(day(20));
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
      expect(last.getDate()).toBe(20);
      expect(last.getHours()).toBe(14);
      expect(last.getMinutes()).toBe(30);
      // Stays open so the time can still be adjusted.
      expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'true');
    });

    it('changing the time updates the value, preserving the day', async () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          label="When"
          granularity="minute"
          defaultValue={new Date(2026, 5, 15, 14, 30)}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('Open calendar'));
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: 'ArrowUp' });
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
      expect(last.getDate()).toBe(15);
      expect(last.getHours()).toBe(15);
    });

    it('honors min at minute resolution (clamps a too-early time)', () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          label="When"
          granularity="minute"
          value={new Date(2026, 5, 15, 12, 0)}
          min={new Date(2026, 5, 15, 9, 0)}
          onChange={onChange}
        />,
      );
      // Type hour 8 (08:00 < 09:00 min) → clamped to the min.
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: '8' });
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
      expect(last.getHours()).toBe(9);
      expect(last.getMinutes()).toBe(0);
    });

    it('Done closes the popover and returns focus to the input', async () => {
      render(
        <DatePicker label="When" granularity="minute" defaultValue={new Date(2026, 5, 15, 9, 0)} />,
      );
      await userEvent.click(screen.getByLabelText('Open calendar'));
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(screen.getByLabelText('Open calendar')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByLabelText('When')).toHaveFocus();
    });

    it('day mode truncates the time to midnight', async () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          label="When"
          defaultValue={new Date(2026, 5, 15, 14, 30)}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('Open calendar'));
      await userEvent.click(day(20));
      const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
      expect(last.getHours()).toBe(0);
      expect(last.getMinutes()).toBe(0);
    });
  });
});
