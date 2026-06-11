import type { FormEvent } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

describe('TagInput', () => {
  it('adds a tag on Enter and renders it as a removable chip', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" onChange={onChange} />);
    const input = screen.getByLabelText('Tags');
    await userEvent.type(input, 'react{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['react'], expect.anything());
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('adds on comma and dedupes by default', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['a']} onChange={onChange} />);
    const input = screen.getByLabelText('Tags');
    await userEvent.type(input, 'a,'); // duplicate ignored
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(input, 'b,');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'], expect.anything());
  });

  it('Backspace on empty input removes the last tag', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['x', 'y']} onChange={onChange} />);
    const input = screen.getByLabelText('Tags');
    input.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['x'], expect.anything());
  });

  it('clicking a chip delete removes that tag', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['keep', 'drop']} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Remove drop'));
    expect(onChange).toHaveBeenLastCalledWith(['keep'], undefined);
  });

  it('enforces max', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['a']} max={1} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Tags'), 'b{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('inside FormField: inner input id + aria from context, single label', () => {
    render(
      <FormField label="Tags" required error errorText="Required" id="tags">
        <TagInput />
      </FormField>,
    );
    // Required FormField appends an aria-hidden "*" to the label text, so match
    // loosely (matches the TextField/Combobox in-FormField test precedent).
    const input = screen.getByLabelText(/Tags/);
    expect(input.id).toBe('tags');
    expect(input).toBeRequired();
    expect(screen.getAllByText('Tags')).toHaveLength(1);
  });

  describe('TagInput bound to a Form', () => {
    it('reads value from the form and writes tag additions back', async () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: ['existing'] } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="Tags">
              <TagInput />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default: 'existing' chip is rendered
      expect(screen.getByText('existing')).toBeInTheDocument();
      // add a new tag
      const input = screen.getByLabelText(/Tags/);
      await userEvent.type(input, 'newone{Enter}');
      // form value updated to include the new tag
      expect(screen.getByTestId('v')).toHaveTextContent('["existing","newone"]');
    });

    it('Backspace removes the last tag from the form-bound value', async () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: ['one', 'two'] } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="Tags">
              <TagInput />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      const input = screen.getByLabelText(/Tags/);
      input.focus();
      await userEvent.keyboard('{Backspace}');
      // reads the form-bound value, not stale internal state
      expect(screen.getByTestId('v')).toHaveTextContent('["one"]');
    });
  });

  it('announces tag add and remove in a polite live region', async () => {
    render(<TagInput label="Tags" defaultValue={['keep']} />);
    const input = screen.getByLabelText('Tags');
    await userEvent.type(input, 'react{Enter}');
    const status = screen.getByText('react added');
    expect(status).toHaveAttribute('aria-live', 'polite');
    await userEvent.click(screen.getByLabelText('Remove keep'));
    expect(screen.getByText('keep removed')).toHaveAttribute('aria-live', 'polite');
  });

  it('onChange receives (tags, event) and forwards onBlur', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<TagInput label="T" onBlur={onBlur} onChange={onChange} />);
    const input = screen.getByLabelText('T');
    await userEvent.type(input, 'a{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['a'], expect.anything());
    input.focus();
    input.blur();
    expect(onBlur).toHaveBeenCalled();
  });

  it('keeps name off the draft input and submits committed tags via hidden inputs', async () => {
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      return data.getAll('tags');
    });
    render(
      <form onSubmit={onSubmit} aria-label="f">
        <TagInput label="T" name="tags" defaultValue={['a', 'b']} />
        <button type="submit">Save</button>
      </form>,
    );
    const input = screen.getByLabelText('T');
    // The draft input must not carry the field name, so the half-typed value
    // is never posted under it.
    expect(input).not.toHaveAttribute('name');
    // One hidden input per committed tag, all under the field name.
    const hidden = document.querySelectorAll('input[type="hidden"][name="tags"]');
    expect(Array.from(hidden).map((el) => (el as HTMLInputElement).value)).toEqual(['a', 'b']);

    // Type an in-progress draft and submit without blurring the input (which
    // would commit the draft as a real tag). The form must post the committed
    // tags, never the uncommitted draft string.
    await userEvent.type(input, 'draftonly');
    const form = screen.getByLabelText('f') as HTMLFormElement;
    form.requestSubmit();
    expect(onSubmit).toHaveReturnedWith(['a', 'b']);
  });
});
