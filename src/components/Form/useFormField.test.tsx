import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      return <Form form={api} aria-label="f"><Probe name="greeting" /></Form>;
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
      return <Form form={api} aria-label="f"><Probe name="greeting" /></Form>;
    }
    render(<Wrap />);
    expect(screen.getByTestId('touched')).toHaveTextContent('false');
    fireEvent.click(screen.getByText('blur'));
    expect(screen.getByTestId('touched')).toHaveTextContent('true');
  });
});
