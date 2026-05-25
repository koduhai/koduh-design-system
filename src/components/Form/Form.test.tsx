import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Form } from './Form';
import { useForm } from './useForm';
import { useOptionalFormContext } from './FormContext';

describe('Form', () => {
  it('renders a form element and forwards className + DOM props', () => {
    const { result } = renderHook(() => useForm());
    render(
      <Form form={result.current} className="x" aria-label="signup" data-test="f">
        <button type="submit">Go</button>
      </Form>,
    );
    const form = screen.getByRole('form', { name: 'signup' });
    expect(form).toHaveClass('x');
    expect(form).toHaveAttribute('data-test', 'f');
  });

  it('calls onValid on submit', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    render(
      <Form form={result.current} onValid={onValid} aria-label="f">
        <button type="submit">Go</button>
      </Form>,
    );
    fireEvent.click(screen.getByText('Go'));
    await waitFor(() => expect(onValid).toHaveBeenCalledWith({ a: 1 }));
  });

  it('exposes the api through context', () => {
    const { result } = renderHook(() => useForm());
    let seen: unknown = null;
    function Probe() {
      seen = useOptionalFormContext();
      return null;
    }
    render(
      <Form form={result.current} aria-label="f">
        <Probe />
      </Form>,
    );
    expect(seen).toBe(result.current);
  });
});
