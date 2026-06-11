import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';
import { FormField } from '../FormField';

describe('Switch', () => {
  it('renders a switch role with its label', () => {
    render(<Switch label="Wi-Fi" />);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
  });

  it('toggles when uncontrolled', async () => {
    render(<Switch label="Wi-Fi" defaultChecked={false} />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    await userEvent.click(sw);
    expect(sw.checked).toBe(true);
  });

  it('controlled: calls onChange with (checked, event), stays fixed without parent update', async () => {
    const onChange = vi.fn();
    render(<Switch label="Wi-Fi" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(sw.checked).toBe(false);
  });

  it('forwards a ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Switch label="X" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('inside <FormField>, associates the description via aria-describedby', () => {
    render(
      <FormField label="Notifications" helperText="Send me emails">
        <Switch />
      </FormField>,
    );
    const sw = screen.getByRole('switch') as HTMLInputElement;
    const describedById = sw.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById as string)).toHaveTextContent('Send me emails');
  });

  it('inside <FormField required>, forwards required + aria-required to the input', () => {
    render(
      <FormField label="Notifications" required>
        <Switch />
      </FormField>,
    );
    const sw = screen.getByRole('switch') as HTMLInputElement;
    expect(sw.required).toBe(true);
    expect(sw).toHaveAttribute('aria-required', 'true');
  });

  it('inside <FormField error>, reflects aria-invalid', () => {
    render(
      <FormField label="Notifications" error errorText="Required">
        <Switch />
      </FormField>,
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
  });

  it('standalone: no field-driven aria-describedby/required by default', () => {
    render(<Switch label="Wi-Fi" />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    expect(sw).not.toHaveAttribute('aria-describedby');
    expect(sw).not.toHaveAttribute('aria-required');
    expect(sw.required).toBe(false);
  });

  it('standalone: forwards its own required prop', () => {
    render(<Switch label="Wi-Fi" required />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    expect(sw.required).toBe(true);
    expect(sw).toHaveAttribute('aria-required', 'true');
  });
});
