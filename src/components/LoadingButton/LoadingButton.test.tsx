import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingButton } from './LoadingButton';

describe('LoadingButton', () => {
  it('renders a normal button when not loading', () => {
    render(<LoadingButton>Save</LoadingButton>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).not.toHaveAttribute('aria-busy');
    expect(btn).not.toBeDisabled();
  });

  it('sets aria-busy and disables interaction while loading', async () => {
    const onClick = vi.fn();
    render(
      <LoadingButton loading onClick={onClick}>
        Save
      </LoadingButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes loadingText to assistive tech while loading', () => {
    render(
      <LoadingButton loading loadingText="Saving…">
        Save
      </LoadingButton>,
    );
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('forwards Button props like tone', () => {
    render(<LoadingButton tone="danger">Delete</LoadingButton>);
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'danger');
  });

  it('strips asChild so the loading guard stays on a native button', async () => {
    const onClick = vi.fn();
    // asChild is not part of the public type; a JS-only consumer could still
    // pass it. It must be stripped so the spinner/disabled contract holds.
    render(
      // @ts-expect-error asChild is intentionally omitted from LoadingButtonProps
      <LoadingButton loading asChild onClick={onClick}>
        Save
      </LoadingButton>,
    );
    // Rendered as a native <button> (not a Slot), so the native disabled guard
    // and the spinner both hold.
    const btn = screen.getByRole('button', { name: /Save/ });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
