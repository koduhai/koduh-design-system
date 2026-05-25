import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Form } from './Form';
import { useForm } from './useForm';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';
import { FormField } from '../FormField';
import { TextField } from '../TextField';

function schema(): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate(value: unknown) {
        const v = value as { name?: string; email?: string };
        const issues: { message: string; path: string[] }[] = [];
        if (!v.name) issues.push({ message: 'Name required', path: ['name'] });
        if (!v.email) issues.push({ message: 'Email required', path: ['email'] });
        return issues.length ? { issues } : { value: v };
      },
    },
  };
}

describe('Form integration', () => {
  it('submits valid values and focuses the first invalid field on failure', async () => {
    const onValid = vi.fn();
    function App() {
      const form = useForm({ resolver: standardSchemaResolver(schema()) });
      return (
        <Form form={form} onValid={onValid} aria-label="signup">
          <FormField name="name" label="Name"><TextField /></FormField>
          <FormField name="email" label="Email"><TextField /></FormField>
          <button type="submit">Submit</button>
        </Form>
      );
    }
    render(<App />);

    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Name required')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    expect(onValid).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@x.com' }),
    );
  });
});
