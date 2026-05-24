import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders a labelled spinbutton-ish numeric input', () => {
    render(<NumberField label="Qty" defaultValue={2} />);
    expect(screen.getByLabelText('Qty')).toHaveValue(2);
  });

  it('increment/decrement buttons step by `step` and clamp to min/max', async () => {
    const onChange = vi.fn();
    render(
      <NumberField label="Qty" defaultValue={9} min={0} max={10} step={1} onChange={onChange} />,
    );
    await userEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenLastCalledWith(10, expect.anything());
    await userEvent.click(screen.getByLabelText('Increment')); // clamped at max
    expect(onChange).toHaveBeenLastCalledWith(10, expect.anything());
  });

  it('typing reports a number; clearing reports null', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Qty" onChange={onChange} />);
    const input = screen.getByLabelText('Qty');
    await userEvent.type(input, '42');
    expect(onChange).toHaveBeenLastCalledWith(42, expect.anything());
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything());
  });

  it('ArrowUp/ArrowDown adjust by step', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Qty" defaultValue={5} step={2} onChange={onChange} />);
    const input = screen.getByLabelText('Qty');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(7, expect.anything());
    await userEvent.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(5, expect.anything());
  });

  it('wires required + error aria', () => {
    render(<NumberField label="Qty" required error errorText="Bad" />);
    const input = screen.getByLabelText(/Qty/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Bad').id);
  });
});
