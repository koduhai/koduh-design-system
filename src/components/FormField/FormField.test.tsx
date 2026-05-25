import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { FormField } from './FormField';
import { useFieldContext, useField, useOptionalFieldContext } from './useField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';

function CustomInput() {
  const { id, describedById, invalid, required } = useFieldContext();
  return (
    <input
      id={id}
      aria-describedby={describedById}
      aria-invalid={invalid || undefined}
      required={required}
    />
  );
}

describe('FormField', () => {
  it('associates the label with the control and shows helperText', () => {
    render(
      <FormField label="Email" helperText="We never share it.">
        <CustomInput />
      </FormField>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    const desc = screen.getByText('We never share it.');
    expect(input).toHaveAttribute('aria-describedby', desc.id);
  });

  it('renders the required indicator and marks the control required', () => {
    render(
      <FormField label="Name" required>
        <CustomInput />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeRequired();
  });

  it('shows errorText, sets aria-invalid, and wires describedby on error', () => {
    render(
      <FormField label="Age" error errorText="Required" helperText="hint">
        <CustomInput />
      </FormField>,
    );
    const input = screen.getByLabelText('Age');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('hint')).toBeNull(); // error replaces helper
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Required').id);
  });

  it('useFieldContext throws outside FormField', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CustomInput />)).toThrow(/FormField/);
    spy.mockRestore();
  });
});

describe('useField (headless)', () => {
  it('derives ids and control props', () => {
    let result: ReturnType<typeof useField> | null = null;
    function Probe() {
      result = useField({ id: 'f1', required: true, error: true, hasDescription: true });
      return null;
    }
    render(<Probe />);
    expect(result!.labelProps.htmlFor).toBe('f1');
    expect(result!.descriptionProps.id).toBe('f1-description');
    expect(result!.controlProps['aria-invalid']).toBe(true);
    expect(result!.controlProps.required).toBe(true);
    expect(result!.controlProps['aria-describedby']).toBe('f1-description');
  });
});

describe('useOptionalFieldContext', () => {
  it('returns null outside a FormField', () => {
    let result: ReturnType<typeof useOptionalFieldContext> | 'unset' = 'unset';
    function Probe() {
      result = useOptionalFieldContext();
      return null;
    }
    render(<Probe />);
    expect(result).toBeNull();
  });

  it('returns the context inside a FormField', () => {
    let capturedId: string | undefined;
    function Probe() {
      capturedId = useOptionalFieldContext()?.id;
      return <input />;
    }
    render(
      <FormField label="X" id="f1">
        <Probe />
      </FormField>,
    );
    expect(capturedId).toBe('f1');
  });
});

describe('FormField bound to a Form', () => {
  function BindingProbe() {
    const ctx = useOptionalFieldContext();
    return (
      <input
        aria-label="probe"
        value={String(ctx?.binding?.value ?? '')}
        onChange={(e) => ctx?.binding?.onChange(e.target.value, e)}
      />
    );
  }

  it('provides a binding carrying the form value and pushes changes back', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { city: 'Paris' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="city" label="City">
            <BindingProbe />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText('probe') as HTMLInputElement;
    expect(input.value).toBe('Paris');
    fireEvent.change(input, { target: { value: 'Lyon' } });
    expect(input.value).toBe('Lyon');
  });

  it('renders the form error as the description after a failed submit', async () => {
    function Wrap() {
      const form = useForm({
        resolver: async (v) =>
        v.city
          ? { values: v, errors: {} as Record<string, string> }
          : { values: v, errors: { city: 'Required' } },
      });
      return (
        <Form form={form} aria-label="f">
          <FormField name="city" label="City">
            <BindingProbe />
          </FormField>
          <button type="submit">Go</button>
        </Form>
      );
    }
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('Required')).toBeInTheDocument();
  });

  it('a bound `required` FormField validates on submit (no resolver)', async () => {
    function Wrap() {
      const form = useForm();
      return (
        <Form form={form} aria-label="f">
          <FormField name="city" label="City" required>
            <BindingProbe />
          </FormField>
          <button type="submit">Go</button>
        </Form>
      );
    }
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });
});
