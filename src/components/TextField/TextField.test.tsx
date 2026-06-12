import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';

describe('TextField', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
  });

  it('renders helper text linked via aria-describedby', () => {
    render(<TextField label="Email" helperText="We never share it." />);
    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('We never share it.');
  });

  it('sets aria-invalid and shows errorText (replacing helperText) when error', () => {
    render(<TextField label="Email" error errorText="Required" helperText="We never share it." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('We never share it.')).toBeNull();
    const describedBy = input.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)).toHaveTextContent('Required');
  });

  it('marks the input required and reflects it on the label', () => {
    render(<TextField label="Email" required />);
    expect(screen.getByLabelText(/Email/)).toBeRequired();
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<TextField label="Name" defaultValue="Ada" />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('Ada');
    await userEvent.type(input, 'x');
    expect(input.value).toBe('Adax');
  });

  it('works controlled: respects value and calls onChange', async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" value="fixed" onChange={onChange} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('fixed');
    await userEvent.type(input, 'z');
    expect(onChange).toHaveBeenCalled();
    expect(input.value).toBe('fixed'); // controlled — unchanged without parent update
  });

  it('reflects size as a data attribute on the root', () => {
    const { container } = render(<TextField label="X" size="lg" />);
    expect(container.querySelector('[data-size]')).toHaveAttribute('data-size', 'lg');
  });

  it('renders start and end adornments', () => {
    render(
      <TextField
        label="Search"
        startAdornment={<span data-testid="start" />}
        endAdornment={<span data-testid="end" />}
      />,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('forwards a ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<TextField label="X" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('inside FormField: no own label, htmlFor targets the input, aria from context', () => {
    render(
      <FormField label="Email" required error errorText="Bad" id="email">
        <TextField />
      </FormField>,
    );
    // Exactly one label, associated with the input.
    const input = screen.getByLabelText(/Email/);
    expect(input.id).toBe('email');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Bad').id);
    // The control did not render a second "Email" label.
    expect(screen.getAllByText('Email')).toHaveLength(1);
  });

  it('standalone: unchanged — renders its own label and required', () => {
    render(<TextField label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeRequired();
  });

  it('standalone without a label: emits no empty <label> element', () => {
    const { container } = render(<TextField aria-label="Name" />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('forwards disabled to the input so the field wrapper can dim it', () => {
    const { container } = render(<TextField label="Email" disabled />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input).toBeDisabled();
    // The disabled input lives inside the .field wrapper that the
    // `:has(input:disabled)` rule dims, so the wrapper contains a disabled input.
    const field = container.querySelector('input:disabled')?.parentElement;
    expect(field).not.toBeNull();
    expect(field?.querySelector('input:disabled')).toBe(input);
  });

  it('omits data-density by default and reflects density="compact" on the root', () => {
    const { container, rerender } = render(<TextField label="Email" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('data-density');
    rerender(<TextField label="Email" density="compact" />);
    expect(root).toHaveAttribute('data-density', 'compact');
  });
});

describe('TextField bound to a Form', () => {
  it('reads its value from the form and writes changes back', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { email: 'a@b.com' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="email" label="Email">
            <TextField />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.value).toBe('a@b.com');
    fireEvent.change(input, { target: { value: 'c@d.com' } });
    expect(input.value).toBe('c@d.com');
  });

  it('coerces a non-string bound value to a string instead of an unchecked cast', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { qty: 42 } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="qty" label="Quantity">
            <TextField />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText('Quantity') as HTMLInputElement;
    // A numeric form value must render as the string '42', not crash or read as
    // a non-string controlled value.
    expect(input.value).toBe('42');
  });
});
