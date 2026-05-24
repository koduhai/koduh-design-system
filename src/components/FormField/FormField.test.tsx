import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { useFieldContext, useField } from './useField';

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
