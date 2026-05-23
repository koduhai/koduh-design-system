import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

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
});
