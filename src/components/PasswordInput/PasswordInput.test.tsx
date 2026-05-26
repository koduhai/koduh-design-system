import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('renders a masked input with the given label', () => {
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles visibility and updates the toggle button a11y state', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    const hideBtn = screen.getByRole('button', { name: 'Hide password' });
    expect(hideBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('forwards the ref to the input and accepts typing (uncontrolled)', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput label="Password" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Password'));
    await user.type(ref.current!, 'hunter2');
    expect(ref.current!.value).toBe('hunter2');
  });

  it('calls onChange with the new value (controlled)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput label="Password" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Password'), 'a');
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it('forwards className to the root', () => {
    const { container } = render(<PasswordInput label="Password" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
