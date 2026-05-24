import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar } from './Snackbar';

beforeAll(() => {
  // jsdom lacks the Popover API; stub so effects don't throw.
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function () {};
    HTMLElement.prototype.hidePopover = function () {};
  }
});

afterEach(() => vi.useRealTimers());

describe('Snackbar', () => {
  it('announces via role=status for non-error severities', () => {
    render(<Snackbar open onClose={() => {}} message="Saved" severity="success" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('uses role=alert for error severity', () => {
    render(<Snackbar open onClose={() => {}} message="Failed" severity="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Snackbar open onClose={onClose} message="Hi" />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-dismisses after autoHideDuration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Snackbar open onClose={onClose} message="Hi" autoHideDuration={3000} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-dismisses after autoHideDuration even when re-rendered with a fresh onClose each render', () => {
    // Regression test: onClose is an inline arrow that changes identity on every
    // render. The timer must NOT restart on re-render (the old behavior depended
    // on `startTimer`/`onClose` identity and would clear+restart the timeout on
    // each parent render, so a parent re-rendering within the window would mean
    // the snackbar never auto-dismisses). It must still fire exactly once.
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(
      <Snackbar open onClose={() => onClose()} message="Hi" autoHideDuration={3000} />,
    );

    // Re-render twice within the window, each time with a brand-new inline
    // onClose, advancing the clock partway each time but never to the full
    // duration in a single uninterrupted span.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    rerender(<Snackbar open onClose={() => onClose()} message="Hi" autoHideDuration={3000} />);
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    rerender(<Snackbar open onClose={() => onClose()} message="Hi" autoHideDuration={3000} />);
    expect(onClose).not.toHaveBeenCalled();

    // Now cross the original 3000ms boundary. With the bug, the timer would have
    // been restarted on each rerender and never reached 3000ms of uninterrupted
    // time, so onClose would not have fired yet.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed within the snackbar', () => {
    const onClose = vi.fn();
    render(<Snackbar open onClose={onClose} message="Hi" />);
    fireEvent.keyDown(screen.getByRole('status'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders an action when provided', () => {
    render(<Snackbar open onClose={() => {}} message="Deleted" action={<button>Undo</button>} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});
