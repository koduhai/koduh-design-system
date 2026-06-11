import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';
import { FormField } from '../FormField';
import { FieldContext } from '../FormField/useField';
import type { FieldContextValue } from '../FormField/useField';

describe('ColorPicker', () => {
  it('shows the current hex and emits onChange from the hex input', async () => {
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" value="#1B5FCC" onChange={onChange} />);
    const input = screen.getByLabelText(/hex/i) as HTMLInputElement;
    expect(input.value.toUpperCase()).toContain('1B5FCC');
    await userEvent.clear(input);
    await userEvent.type(input, '#FF0000');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('#FF0000');
  });
  it('selecting a swatch emits its hex', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1B5FCC" onChange={onChange} swatches={['#FF0000', '#00FF00']} />);
    await userEvent.click(screen.getByRole('button', { name: /#FF0000/i }));
    expect(onChange).toHaveBeenCalledWith('#FF0000');
  });
  it('exposes hue as a slider', () => {
    render(<ColorPicker value="#1B5FCC" />);
    expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
  });
  it('renders an alpha slider only when alpha is set', () => {
    const { rerender } = render(<ColorPicker value="#1B5FCC" />);
    expect(screen.queryByRole('slider', { name: /alpha/i })).toBeNull();
    rerender(<ColorPicker value="#1B5FCC" alpha />);
    expect(screen.getByRole('slider', { name: /alpha/i })).toBeInTheDocument();
  });
  it('exposes the saturation/brightness square as a slider with a hex valuetext', () => {
    render(<ColorPicker value="#1B5FCC" />);
    const sv = screen.getByRole('slider', { name: /saturation/i });
    expect(sv).toHaveAttribute('aria-valuetext', expect.stringMatching(/#1B5FCC/i));
  });
  it('nudges saturation/brightness with arrow keys', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#808080" onChange={onChange} />);
    const sv = screen.getByRole('slider', { name: /saturation/i });
    sv.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenCalled();
  });
  it('changes hue with arrow keys', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1B5FCC" onChange={onChange} />);
    const hue = screen.getByRole('slider', { name: /hue/i });
    hue.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalled();
  });
  it('reverts an invalid hex input on blur without emitting', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1B5FCC" onChange={onChange} />);
    const input = screen.getByLabelText(/hex/i) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'zzz');
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value.toUpperCase()).toContain('1B5FCC');
  });
  it('renders a visible hex readout so color is not the only signal', () => {
    render(<ColorPicker value="#1B5FCC" />);
    // appears as the input value and as a readout
    expect(screen.getAllByText(/1B5FCC/i).length).toBeGreaterThan(0);
  });
  it('forwards className to the root', () => {
    const { container } = render(<ColorPicker value="#1B5FCC" className="x" />);
    expect(container.firstElementChild).toHaveClass('x');
  });
  it('associates a standalone label with the group', () => {
    render(<ColorPicker value="#1B5FCC" label="Brand" />);
    const group = screen.getByRole('group', { name: 'Brand' });
    expect(group).toBeInTheDocument();
  });
  it('honors an enclosing FormField for label/description/required', () => {
    render(
      <FormField label="Theme color" helperText="Pick one" required>
        <ColorPicker value="#1B5FCC" />
      </FormField>,
    );
    const group = screen.getByRole('group', { name: 'Theme color' });
    expect(group).toHaveAccessibleDescription('Pick one');
    expect(group).toHaveAttribute('aria-required', 'true');
  });
  it('falls back to defaultValue when a Form binding holds a non-string value', () => {
    // The Form binding value is typed `unknown`; a non-string value must not be
    // displayed raw in the hex input. It should fall back to defaultValue.
    const ctx: FieldContextValue = {
      id: 'cp',
      labelId: 'cp-label',
      invalid: false,
      required: false,
      binding: {
        name: 'color',
        value: 42 as unknown,
        onChange: () => undefined,
        onBlur: () => undefined,
      },
    };
    render(
      <FieldContext.Provider value={ctx}>
        <ColorPicker defaultValue="#1B5FCC" />
      </FieldContext.Provider>,
    );
    const input = screen.getByLabelText(/hex/i) as HTMLInputElement;
    expect(input.value.toUpperCase()).toContain('1B5FCC');
    expect(input.value).not.toContain('42');
  });
  it('does not mark the hex readout as an aria-live region (avoids drag flooding)', () => {
    const { container } = render(<ColorPicker value="#1B5FCC" />);
    const live = container.querySelector('[aria-live]');
    expect(live).toBeNull();
  });
  it('exposes the saturation/brightness square with ARIA slider values', () => {
    render(<ColorPicker value="#1B5FCC" />);
    const sv = screen.getByRole('slider', { name: /saturation/i });
    expect(sv).toHaveAttribute('aria-valuemin', '0');
    expect(sv).toHaveAttribute('aria-valuemax', '100');
    expect(sv).toHaveAttribute('aria-valuenow');
    expect(sv).toHaveAttribute('aria-valuetext', expect.stringMatching(/saturation/i));
    expect(sv).toHaveAttribute('aria-valuetext', expect.stringMatching(/#1B5FCC/i));
  });
});
