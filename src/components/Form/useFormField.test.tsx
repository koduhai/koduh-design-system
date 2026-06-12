import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { useFormField } from './useFormField';
import type { FormApi } from './useForm';

function Probe({ name }: { name: string }) {
  const f = useFormField(name);
  return (
    <div>
      <span data-testid="val">{String(f.value ?? '')}</span>
      <span data-testid="touched">{String(f.touched)}</span>
      <button onClick={() => f.onChange('hi')}>set</button>
      <button onClick={() => f.onBlur()}>blur</button>
    </div>
  );
}

describe('useFormField', () => {
  it('reflects the field value and updates on onChange', () => {
    let api!: FormApi;
    function Wrap() {
      api = useForm({ defaultValues: { greeting: 'hello' } });
      return (
        <Form form={api} aria-label="f">
          <Probe name="greeting" />
        </Form>
      );
    }
    render(<Wrap />);
    expect(screen.getByTestId('val')).toHaveTextContent('hello');
    fireEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('val')).toHaveTextContent('hi');
  });

  it('marks touched on onBlur', () => {
    let api!: FormApi;
    function Wrap() {
      api = useForm();
      return (
        <Form form={api} aria-label="f">
          <Probe name="greeting" />
        </Form>
      );
    }
    render(<Wrap />);
    expect(screen.getByTestId('touched')).toHaveTextContent('false');
    fireEvent.click(screen.getByText('blur'));
    expect(screen.getByTestId('touched')).toHaveTextContent('true');
  });

  it('re-validates with the latest rules when required toggles at runtime', async () => {
    let api!: FormApi;
    function ToggleProbe() {
      const [req, setReq] = useState(false);
      const f = useFormField('name', { required: req });
      return (
        <div>
          <span data-testid="error">{f.error ?? ''}</span>
          <button onClick={() => setReq(true)}>require</button>
          <button onClick={() => f.onChange('')}>clear</button>
        </div>
      );
    }
    function Wrap() {
      api = useForm({ mode: 'onChange' });
      return (
        <Form form={api} aria-label="f">
          <ToggleProbe />
        </Form>
      );
    }
    render(<Wrap />);
    // Not required yet: an empty change produces no error.
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(''));
    // Toggle required on, then change again: the new rule must apply even though
    // the field was registered with required=false.
    fireEvent.click(screen.getByText('require'));
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('This field is required'),
    );
  });

  it('stops validating a rule once it is toggled off at runtime', async () => {
    let api!: FormApi;
    function ToggleProbe() {
      const [req, setReq] = useState(true);
      const f = useFormField('name', req ? { required: true } : undefined);
      return (
        <div>
          <span data-testid="error">{f.error ?? ''}</span>
          <button onClick={() => setReq(false)}>relax</button>
          <button onClick={() => f.onChange('')}>clear</button>
        </div>
      );
    }
    function Wrap() {
      api = useForm({ mode: 'onChange' });
      return (
        <Form form={api} aria-label="f">
          <ToggleProbe />
        </Form>
      );
    }
    render(<Wrap />);
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('This field is required'),
    );
    // Drop the rule, then change again: the required error must clear.
    fireEvent.click(screen.getByText('relax'));
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(''));
  });
});
