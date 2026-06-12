import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { PinInput } from './PinInput';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

const cells = () => screen.getAllByRole('textbox') as HTMLInputElement[];

describe('PinInput', () => {
  it('renders `length` cells (default 6)', () => {
    render(<PinInput aria-label="Code" />);
    expect(cells()).toHaveLength(6);
  });

  it('honors a custom length', () => {
    render(<PinInput length={4} aria-label="Code" />);
    expect(cells()).toHaveLength(4);
  });

  it('typing a digit advances focus to the next cell', () => {
    render(<PinInput length={4} aria-label="Code" />);
    const [c0, c1] = cells();
    c0!.focus();
    fireEvent.change(c0!, { target: { value: '1' } });
    expect(c0!.value).toBe('1');
    expect(document.activeElement).toBe(c1);
  });

  it('rejects non-numeric input when type="number"', () => {
    render(<PinInput length={4} aria-label="Code" />);
    const [c0] = cells();
    fireEvent.change(c0!, { target: { value: 'a' } });
    expect(c0!.value).toBe('');
  });

  it('accepts letters when type="text"', () => {
    render(<PinInput length={4} type="text" aria-label="Code" />);
    const [c0] = cells();
    fireEvent.change(c0!, { target: { value: 'a' } });
    expect(c0!.value).toBe('a');
  });

  it('preserves a trailing space when type="text"', () => {
    const onChange = vi.fn();
    render(
      <PinInput length={4} type="text" defaultValue="ab" onChange={onChange} aria-label="Code" />,
    );
    const c2 = cells()[2]!;
    // A space is a valid single character for a text PIN and must not be stripped.
    fireEvent.change(c2, { target: { value: ' ' } });
    expect(onChange).toHaveBeenLastCalledWith('ab ');
    expect(cells()[2]!.value).toBe(' ');
  });

  it('preserves trailing spaces pasted into a text PIN', () => {
    const onChange = vi.fn();
    render(<PinInput length={6} type="text" onChange={onChange} aria-label="Code" />);
    const c0 = cells()[0]!;
    c0.focus();
    fireEvent.paste(c0, { clipboardData: { getData: () => 'ab  ' } });
    expect(onChange).toHaveBeenLastCalledWith('ab  ');
  });

  it('Backspace on an empty cell clears the previous one and moves back', () => {
    render(<PinInput length={4} defaultValue="12" aria-label="Code" />);
    const [c0, c1, c2] = cells();
    c2!.focus();
    fireEvent.keyDown(c2!, { key: 'Backspace' });
    expect(document.activeElement).toBe(c1);
    expect(c1!.value).toBe('');
    expect(c0!.value).toBe('1');
  });

  it('Backspace on a filled cell clears it in place', () => {
    render(<PinInput length={4} defaultValue="12" aria-label="Code" />);
    const [, c1] = cells();
    c1!.focus();
    fireEvent.keyDown(c1!, { key: 'Backspace' });
    expect(c1!.value).toBe('');
  });

  it('Arrow keys move between cells', () => {
    render(<PinInput length={4} aria-label="Code" />);
    const [c0, c1] = cells();
    c0!.focus();
    fireEvent.keyDown(c0!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(c1);
    fireEvent.keyDown(c1!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(c0);
  });

  it('paste distributes characters across cells', () => {
    const onChange = vi.fn();
    render(<PinInput length={6} onChange={onChange} aria-label="Code" />);
    const [c0] = cells();
    c0!.focus();
    fireEvent.paste(c0!, {
      clipboardData: { getData: () => '123456' },
    });
    expect(onChange).toHaveBeenLastCalledWith('123456');
    expect(
      cells()
        .map((c) => c.value)
        .join(''),
    ).toBe('123456');
  });

  it('paste filters out disallowed characters for type="number"', () => {
    render(<PinInput length={4} aria-label="Code" />);
    const [c0] = cells();
    c0!.focus();
    fireEvent.paste(c0!, { clipboardData: { getData: () => '1a2b' } });
    expect(
      cells()
        .map((c) => c.value)
        .join(''),
    ).toBe('12');
  });

  it('fires onComplete once all cells are filled', () => {
    const onComplete = vi.fn();
    render(<PinInput length={3} onComplete={onComplete} aria-label="Code" />);
    const [c0, c1, c2] = cells();
    fireEvent.change(c0!, { target: { value: '1' } });
    fireEvent.change(c1!, { target: { value: '2' } });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(c2!, { target: { value: '3' } });
    expect(onComplete).toHaveBeenCalledWith('123');
  });

  it('fires onComplete only on the incomplete -> complete transition, not on later edits', () => {
    const onComplete = vi.fn();
    render(<PinInput length={3} onComplete={onComplete} aria-label="Code" />);
    const [c0, c1, c2] = cells();
    fireEvent.change(c0!, { target: { value: '1' } });
    fireEvent.change(c1!, { target: { value: '2' } });
    fireEvent.change(c2!, { target: { value: '3' } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Overwriting an already-filled cell keeps the PIN full but must not re-fire.
    fireEvent.change(c0!, { target: { value: '9' } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Clearing a cell (incomplete) then refilling it re-fires exactly once more.
    fireEvent.keyDown(c2!, { key: 'Backspace' });
    expect(cells()[2]!.value).toBe('');
    fireEvent.change(cells()[2]!, { target: { value: '7' } });
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith('927');
  });

  it('works as a controlled component', () => {
    function Controlled() {
      const [v, setV] = useState('12');
      return <PinInput length={4} value={v} onChange={setV} aria-label="Code" />;
    }
    render(<Controlled />);
    const [c0, c1, c2] = cells();
    expect(c0!.value).toBe('1');
    expect(c1!.value).toBe('2');
    fireEvent.change(c2!, { target: { value: '3' } });
    expect(cells()[2]!.value).toBe('3');
  });

  it('masks values when mask is set', () => {
    render(<PinInput length={4} mask defaultValue="1" aria-label="Code" />);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0); // password inputs are not role=textbox
    const pwd = document.querySelectorAll('input[type="password"]');
    expect(pwd).toHaveLength(4);
  });

  it('disables all cells when disabled', () => {
    render(<PinInput length={4} disabled aria-label="Code" />);
    cells().forEach((c) => expect(c).toBeDisabled());
  });

  it('composes with FormField (forwards group id + aria-describedby)', () => {
    render(
      <FormField label="One-time code" helperText="Check your phone">
        <PinInput length={4} />
      </FormField>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('id');
    expect(group).toHaveAttribute('aria-describedby');
  });

  it('forwards arbitrary DOM props to the group', () => {
    render(<PinInput length={4} aria-label="Code" data-testid="pin" />);
    expect(screen.getByTestId('pin')).toBeInTheDocument();
  });
});

describe('PinInput bound to a Form', () => {
  it('reads its value from the form and writes changes back', () => {
    function Probe() {
      const field = useFormField('code');
      return <span data-testid="probe">{String(field.value)}</span>;
    }
    function Wrap() {
      const form = useForm({ defaultValues: { code: '12' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="code" label="Code">
            <PinInput length={4} type="number" />
          </FormField>
          <Probe />
        </Form>
      );
    }
    render(<Wrap />);
    // The default value '12' should populate the first two cells.
    const allCells = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(allCells[0]!.value).toBe('1');
    expect(allCells[1]!.value).toBe('2');
    // Type a digit into the third cell — form value should update.
    fireEvent.change(allCells[2]!, { target: { value: '3' } });
    expect(screen.getByTestId('probe').textContent).toBe('123');
  });
});
