import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePicker } from './TimePicker';
import { KoduhI18nProvider } from '../../i18n';
import { FormField } from '../FormField';

const hour = () => screen.getByRole('spinbutton', { name: 'Hour' });
const minute = () => screen.getByRole('spinbutton', { name: 'Minute' });

describe('TimePicker', () => {
  it('renders hour and minute spinbuttons (24h, no seconds/period by default)', () => {
    render(<TimePicker label="Time" />);
    expect(hour()).toBeInTheDocument();
    expect(minute()).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Second' })).toBeNull();
    expect(screen.queryByRole('spinbutton', { name: 'AM/PM' })).toBeNull();
  });

  it('seeds segment values from a controlled value', () => {
    render(<TimePicker label="Time" value={new Date(2024, 0, 1, 14, 5)} />);
    expect(hour()).toHaveAttribute('aria-valuenow', '14');
    expect(hour()).toHaveTextContent('14');
    expect(minute()).toHaveTextContent('05');
  });

  it('types digits into segments and emits a Date once hour+minute are set', () => {
    const onChange = vi.fn();
    render(<TimePicker label="Time" onChange={onChange} />);
    fireEvent.keyDown(hour(), { key: '9' });
    fireEvent.keyDown(minute(), { key: '3' });
    fireEvent.keyDown(minute(), { key: '0' });
    const last = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
    expect(last.getHours()).toBe(9);
    expect(last.getMinutes()).toBe(30);
  });

  it('ArrowUp/ArrowDown step the focused segment with wraparound', () => {
    const onChange = vi.fn();
    render(<TimePicker label="Time" value={new Date(2024, 0, 1, 23, 59)} onChange={onChange} />);
    fireEvent.keyDown(hour(), { key: 'ArrowUp' }); // 23 -> 00
    expect((onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date).getHours()).toBe(0);
    fireEvent.keyDown(minute(), { key: 'ArrowDown' }); // 59 -> 58
    expect((onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date).getMinutes()).toBe(58);
  });

  it('honors minuteStep when stepping the minute segment', () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        label="Time"
        minuteStep={15}
        value={new Date(2024, 0, 1, 8, 0)}
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(minute(), { key: 'ArrowUp' }); // 0 -> 15
    expect((onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date).getMinutes()).toBe(15);
  });

  it('Backspace clears a segment; clearing all emits null', () => {
    const onChange = vi.fn();
    render(<TimePicker label="Time" value={new Date(2024, 0, 1, 8, 30)} onChange={onChange} />);
    fireEvent.keyDown(minute(), { key: 'Backspace' });
    fireEvent.keyDown(hour(), { key: 'Backspace' });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('12-hour mode renders an AM/PM segment and toggles the period', () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        label="Time"
        hourCycle={12}
        value={new Date(2024, 0, 1, 8, 0)}
        onChange={onChange}
      />,
    );
    const period = screen.getByRole('spinbutton', { name: 'AM/PM' });
    expect(period).toHaveTextContent(/AM/i);
    // 8 AM displayed as hour 08
    expect(hour()).toHaveTextContent('08');
    fireEvent.keyDown(period, { key: 'p' }); // AM -> PM
    expect((onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date).getHours()).toBe(20);
    expect(period).toHaveTextContent(/PM/i);
  });

  it('renders a seconds segment when withSeconds is set', () => {
    render(<TimePicker label="Time" withSeconds value={new Date(2024, 0, 1, 8, 30, 15)} />);
    expect(screen.getByRole('spinbutton', { name: 'Second' })).toHaveTextContent('15');
  });

  it('ArrowRight/ArrowLeft move focus between segments', () => {
    render(<TimePicker label="Time" />);
    hour().focus();
    fireEvent.keyDown(hour(), { key: 'ArrowRight' });
    expect(minute()).toHaveFocus();
    fireEvent.keyDown(minute(), { key: 'ArrowLeft' });
    expect(hour()).toHaveFocus();
  });

  it('inside FormField: defers the accessible name to the field, no own label', () => {
    render(
      <FormField label="Start time" id="start">
        <TimePicker />
      </FormField>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby', screen.getByText('Start time').id);
    expect(screen.getAllByText('Start time')).toHaveLength(1);
  });

  it('inside FormField: error reaches the group via aria-describedby (no aria-invalid on the group)', () => {
    render(
      <FormField label="Time" error errorText="Required" id="t">
        <TimePicker />
      </FormField>,
    );
    const group = screen.getByRole('group');
    expect(group).not.toHaveAttribute('aria-invalid');
    expect(group.getAttribute('aria-describedby')).toContain(screen.getByText('Required').id);
  });

  it('i18n: flows a provider override through to the segment labels', () => {
    render(
      <KoduhI18nProvider messages={{ timePicker: { hour: 'Heure', minute: 'Minute' } }}>
        <TimePicker label="Heure" />
      </KoduhI18nProvider>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Heure' })).toBeInTheDocument();
  });

  it('does not step when disabled', () => {
    const onChange = vi.fn();
    render(
      <TimePicker label="Time" disabled value={new Date(2024, 0, 1, 8, 0)} onChange={onChange} />,
    );
    fireEvent.keyDown(hour(), { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
