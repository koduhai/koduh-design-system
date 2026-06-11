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
    render(
      <Snackbar open onOpenChange={() => {}} severity="success">
        Saved
      </Snackbar>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('uses role=alert for error severity', () => {
    render(
      <Snackbar open onOpenChange={() => {}} severity="error">
        Failed
      </Snackbar>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Snackbar open onOpenChange={onOpenChange}>
        Hi
      </Snackbar>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('auto-dismisses after autoHideDuration', () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <Snackbar open onOpenChange={onOpenChange} autoHideDuration={3000}>
        Hi
      </Snackbar>,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('auto-dismisses after autoHideDuration even when re-rendered with a fresh onOpenChange each render', () => {
    // Regression test: onOpenChange is an inline arrow that changes identity on
    // every render. The timer must NOT restart on re-render (the old behavior
    // depended on `startTimer`/`onOpenChange` identity and would clear+restart
    // the timeout on each parent render, so a parent re-rendering within the
    // window would mean the snackbar never auto-dismisses). It must still fire
    // exactly once.
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Snackbar open onOpenChange={(o) => onOpenChange(o)} autoHideDuration={3000}>
        Hi
      </Snackbar>,
    );

    // Re-render twice within the window, each time with a brand-new inline
    // onOpenChange, advancing the clock partway each time but never to the full
    // duration in a single uninterrupted span.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    rerender(
      <Snackbar open onOpenChange={(o) => onOpenChange(o)} autoHideDuration={3000}>
        Hi
      </Snackbar>,
    );
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    rerender(
      <Snackbar open onOpenChange={(o) => onOpenChange(o)} autoHideDuration={3000}>
        Hi
      </Snackbar>,
    );
    expect(onOpenChange).not.toHaveBeenCalled();

    // Now cross the original 3000ms boundary. With the bug, the timer would have
    // been restarted on each rerender and never reached 3000ms of uninterrupted
    // time, so onOpenChange would not have fired yet.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when Escape is pressed within the snackbar', () => {
    const onOpenChange = vi.fn();
    render(
      <Snackbar open onOpenChange={onOpenChange}>
        Hi
      </Snackbar>,
    );
    fireEvent.keyDown(screen.getByRole('status'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the live region in the accessibility tree while closed so opening is announced', () => {
    // The aria-live container must persist (not display:none) so that inserting
    // the message on open is announced. While closed it stays present but empty.
    const { rerender } = render(
      <Snackbar open={false} onOpenChange={() => {}} severity="success">
        Saved
      </Snackbar>,
    );
    const region = screen.getByRole('status');
    expect(region).toBeInTheDocument();
    // Closed: the message (and its chrome) is not yet inserted into the region.
    expect(region).not.toHaveTextContent('Saved');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    rerender(
      <Snackbar open onOpenChange={() => {}} severity="success">
        Saved
      </Snackbar>,
    );
    // Opening inserts the content into the already-present region.
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('renders an action when provided', () => {
    render(
      <Snackbar open onOpenChange={() => {}} action={<button>Undo</button>}>
        Deleted
      </Snackbar>,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});
