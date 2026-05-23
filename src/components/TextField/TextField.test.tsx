import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField';

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
});
