import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';
import { FormField } from '../FormField';

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

  it('onChange receives (tags, event) and forwards onBlur/name to the input', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<TagInput label="T" name="tags" onBlur={onBlur} onChange={onChange} />);
    const input = screen.getByLabelText('T');
    expect(input).toHaveAttribute('name', 'tags');
    await userEvent.type(input, 'a{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['a'], expect.anything());
    input.focus();
    input.blur();
    expect(onBlur).toHaveBeenCalled();
  });
});
