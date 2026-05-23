import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label with a textarea element', () => {
    render(<Textarea label="Bio" />);
    const el = screen.getByLabelText('Bio');
    expect(el.tagName).toBe('TEXTAREA');
    expect(el.id).toBeTruthy();
  });

  it('renders helper text linked via aria-describedby', () => {
    render(<Textarea label="Bio" helperText="Max 200 chars." />);
    const el = screen.getByLabelText('Bio');
    const describedBy = el.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)).toHaveTextContent('Max 200 chars.');
  });

  it('sets aria-invalid and shows errorText replacing helperText on error', () => {
    render(<Textarea label="Bio" error errorText="Required" helperText="Optional hint" />);
    const el = screen.getByLabelText('Bio');
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Optional hint')).toBeNull();
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<Textarea label="Bio" defaultValue="Hi" />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    expect(el.value).toBe('Hi');
    await userEvent.type(el, '!');
    expect(el.value).toBe('Hi!');
  });

  it('works controlled: respects value and calls onChange with the new value', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Bio" value="fixed" onChange={onChange} />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    await userEvent.type(el, 'z');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0]).toBe('fixedz');
    expect(el.value).toBe('fixed'); // controlled — unchanged without parent update
  });

  it('forwards a ref to the textarea element', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea label="Bio" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('adjusts height on input when autoResize is set', async () => {
    render(<Textarea label="Bio" autoResize />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    // jsdom reports scrollHeight 0; stub it so the resize effect has something to read.
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 120 });
    await userEvent.type(el, 'a lot of text');
    expect(el.style.height).not.toBe('');
  });
});
