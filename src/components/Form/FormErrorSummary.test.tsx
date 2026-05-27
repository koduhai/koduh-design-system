import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { FormErrorSummary } from './FormErrorSummary';
import { FormField } from '../FormField';
import { TextField } from '../TextField';

function Wrap() {
  const form = useForm({
    resolver: async (v) => ({
      values: v,
      errors: {
        ...(v.email ? {} : { email: 'Email required' }),
        ...(v.name ? {} : { name: 'Name required' }),
      } as Record<string, string>,
    }),
  });
  return (
    <Form form={form} aria-label="f">
      <FormErrorSummary heading="Fix these" />
      <FormField name="name" label="Name"><TextField /></FormField>
      <FormField name="email" label="Email"><TextField /></FormField>
      <button type="submit">Go</button>
    </Form>
  );
}

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    render(<Wrap />);
    expect(screen.queryByText('Fix these')).not.toBeInTheDocument();
  });

  it('lists errors after a failed submit and focuses a field on link click', async () => {
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('Fix these')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Email required' });
    fireEvent.click(link);
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('moves focus to the summary region on a failed submit', async () => {
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    const region = await screen.findByRole('group', { name: 'Fix these' });
    expect(region).toHaveAttribute('tabindex', '-1');
    expect(region).toHaveFocus();
  });

  it('renders plain text (not a link) for an error with no registered field id', async () => {
    function NoFieldWrap() {
      const form = useForm({
        // Resolver-level error keyed to a field that has no bound input/DOM id.
        resolver: async (v) => ({ values: v, errors: { server: 'Server is down' } }),
      });
      return (
        <Form form={form} aria-label="f">
          <FormErrorSummary heading="Problems" />
          <button type="submit">Go</button>
        </Form>
      );
    }
    render(<NoFieldWrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    // No dead <a href={undefined}> — the message is plain text.
    expect(screen.queryByRole('link', { name: 'Server is down' })).toBeNull();
  });
});
