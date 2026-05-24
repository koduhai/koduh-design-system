import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('adds a tag on Enter and renders it as a removable chip', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" onChange={onChange} />);
    const input = screen.getByLabelText('Tags');
    await userEvent.type(input, 'react{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['react']);
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
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  });

  it('Backspace on empty input removes the last tag', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['x', 'y']} onChange={onChange} />);
    const input = screen.getByLabelText('Tags');
    input.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['x']);
  });

  it('clicking a chip delete removes that tag', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['keep', 'drop']} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Remove drop'));
    expect(onChange).toHaveBeenLastCalledWith(['keep']);
  });

  it('enforces max', async () => {
    const onChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['a']} max={1} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Tags'), 'b{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
