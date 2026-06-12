import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';

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

  it('clamps height to maxRows and enables scrolling when content overflows', async () => {
    // jsdom getComputedStyle returns no line-height → the effect falls back to
    // 20px/row with 0 padding/border, so maxRows={3} caps height at 60px.
    render(<Textarea label="Bio" autoResize minRows={2} maxRows={3} />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 500 });
    await userEvent.type(el, 'overflowing content');
    expect(el.style.height).toBe('60px');
    expect(el.style.overflowY).toBe('auto');
  });

  it('clears inline height/overflow when autoResize is toggled off', async () => {
    const { rerender } = render(<Textarea label="Bio" autoResize maxRows={3} />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 500 });
    await userEvent.type(el, 'overflowing content');
    expect(el.style.height).not.toBe('');
    expect(el.style.overflowY).toBe('auto');
    rerender(<Textarea label="Bio" maxRows={3} />);
    expect(el.style.height).toBe('');
    expect(el.style.overflowY).toBe('');
  });

  it('inside FormField: defers label + aria to the field', () => {
    render(
      <FormField label="Bio" error errorText="Too long" id="bio">
        <Textarea />
      </FormField>,
    );
    const ta = screen.getByLabelText('Bio');
    expect(ta.id).toBe('bio');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    expect(ta).toHaveAttribute('aria-describedby', screen.getByText('Too long').id);
    expect(screen.getAllByText('Bio')).toHaveLength(1);
  });

  it('standalone: unchanged', () => {
    render(<Textarea label="Notes" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});

describe('Textarea bound to a Form', () => {
  it('reads its value from the form and writes changes back', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { bio: 'hi' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="bio" label="Bio">
            <Textarea />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    expect(el.value).toBe('hi');
    fireEvent.change(el, { target: { value: 'bye' } });
    expect(el.value).toBe('bye');
  });
});
