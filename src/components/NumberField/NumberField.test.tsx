import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from './NumberField';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

describe('NumberField', () => {
  it('renders a labelled numeric (text-mode) input', () => {
    render(<NumberField label="Qty" defaultValue={2} />);
    // type="text" (see NumberField.tsx) so the value reads back as a string.
    expect(screen.getByLabelText('Qty')).toHaveValue('2');
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

  it('reaches a decimal like "1.5" while editing (controlled)', async () => {
    // Previously the display was derived as String(parse(text)); with the parent
    // echoing the parsed number back, the trailing-decimal text was clobbered so
    // "1.5" was unreachable. The raw-text buffer keeps the typed characters.
    function Controlled() {
      const [v, setV] = useState<number | null>(1);
      return <NumberField label="Qty" value={v ?? undefined} onChange={setV} />;
    }
    render(<Controlled />);
    const input = screen.getByLabelText('Qty') as HTMLInputElement;
    await userEvent.type(input, '.5');
    expect(input.value).toBe('1.5');
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

  it('inside FormField: no own label, input id + aria from context', () => {
    render(
      <FormField label="Quantity" required error errorText="Bad" id="qty">
        <NumberField />
      </FormField>,
    );
    const input = screen.getByLabelText(/Quantity/);
    expect(input.id).toBe('qty');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Bad').id);
    // The control did not render a second "Quantity" label.
    expect(screen.getAllByText('Quantity')).toHaveLength(1);
  });

  it('standalone: unchanged — renders its own label and required', () => {
    render(<NumberField label="Qty" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Qty/)).toBeRequired();
  });
});

describe('NumberField bound to a Form', () => {
  it('reads its value from the form and writes changes back', async () => {
    function Probe() {
      const field = useFormField('qty');
      return <span data-testid="probe">{String(field.value)}</span>;
    }
    function Wrap() {
      const form = useForm({ defaultValues: { qty: 5 } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="qty" label="Qty">
            <NumberField />
          </FormField>
          <Probe />
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText(/Qty/) as HTMLInputElement;
    expect(input.value).toBe('5');
    await userEvent.clear(input);
    await userEvent.type(input, '7');
    expect(screen.getByTestId('probe').textContent).toBe('7');
  });

  it('preserves an intermediate decimal like "1." while editing (bound)', async () => {
    function Wrap() {
      const form = useForm({ defaultValues: { qty: 1 } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="qty" label="Qty">
            <NumberField />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText(/Qty/) as HTMLInputElement;
    await userEvent.type(input, '.5');
    expect(input.value).toBe('1.5');
  });

  it('re-syncs the display from the bound value on form reset()', async () => {
    let api!: ReturnType<typeof useForm>;
    function Wrap() {
      api = useForm({ defaultValues: { qty: 5 } });
      return (
        <Form form={api} aria-label="f">
          <FormField name="qty" label="Qty">
            <NumberField />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText(/Qty/) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '99');
    expect(input.value).toBe('99');
    act(() => api.reset());
    expect(input.value).toBe('5');
  });
});
