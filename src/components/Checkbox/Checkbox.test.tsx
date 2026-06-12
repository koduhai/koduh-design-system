import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';
import { FormField } from '../FormField';

describe('Checkbox', () => {
  it('renders an accessible checkbox associated with its label', () => {
    render(<Checkbox label="Accept terms" />);
    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(box).toBeInTheDocument();
  });

  it('works uncontrolled with defaultChecked', async () => {
    render(<Checkbox label="A" defaultChecked />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.checked).toBe(true);
    await userEvent.click(box);
    expect(box.checked).toBe(false);
  });

  it('works controlled: respects checked and calls onChange with (checked, event)', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="A" checked={false} onChange={onChange} />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(box.checked).toBe(false); // controlled — unchanged without parent update
  });

  it('reflects indeterminate on the DOM node', () => {
    render(<Checkbox label="A" indeterminate />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
  });

  it('sets aria-invalid when error', () => {
    render(<Checkbox label="A" error />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards a ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox label="A" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('associates FormField description via aria-describedby', () => {
    render(
      <FormField label="Subscribe" helperText="We never share it.">
        <Checkbox />
      </FormField>,
    );
    const box = screen.getByRole('checkbox');
    const desc = screen.getByText('We never share it.');
    expect(box).toHaveAttribute('aria-describedby', desc.id);
  });

  it('inherits required from a FormField', () => {
    render(
      <FormField label="Agree" required>
        <Checkbox />
      </FormField>,
    );
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('honors a standalone required prop without a FormField', () => {
    render(<Checkbox label="A" required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });
});
