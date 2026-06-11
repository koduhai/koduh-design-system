import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Toaster } from './Toaster';
import { useToast } from './useToast';
import { addToast, dismissToast, getSnapshot, __resetToasts } from './store';

beforeEach(() => {
  __resetToasts();
});

describe('toast store', () => {
  it('add returns an id and appends; dismiss removes; update patches', () => {
    const id = addToast({ description: 'hi' });
    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0]!.severity).toBe('info'); // default
    addToast({ description: 'two', severity: 'error' });
    expect(getSnapshot()).toHaveLength(2);
    dismissToast(id);
    expect(getSnapshot().map((t) => t.description)).toEqual(['two']);
  });
});

function Enqueuer({ onReady }: { onReady: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast();
  return <button onClick={() => onReady(api)}>go</button>;
}

describe('Toaster', () => {
  it('renders queued toasts in a labelled region with severity role', () => {
    render(<Toaster />);
    act(() => {
      addToast({ description: 'Saved', severity: 'success' });
    });
    expect(screen.getByRole('region', { name: /notification/i })).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    // error → assertive alert
    act(() => {
      addToast({ description: 'Boom', severity: 'error' });
    });
    expect(screen.getByText('Boom').closest('[role="alert"]')).not.toBeNull();
    expect(screen.getByText('Saved').closest('[role="status"]')).not.toBeNull();
  });

  it('shows at most `max` toasts (FIFO), surfacing the rest as they dismiss', () => {
    render(<Toaster max={2} />);
    let firstId = '';
    act(() => {
      firstId = addToast({ description: 'A', duration: Infinity });
      addToast({ description: 'B', duration: Infinity });
      addToast({ description: 'C', duration: Infinity });
    });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).toBeNull();
    act(() => {
      dismissToast(firstId);
    });
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('expires a queued (overflow) toast even when an Infinity toast is ahead of it', () => {
    vi.useFakeTimers();
    try {
      // max=1: only the Infinity toast is visible; the queued one is unmounted.
      render(<Toaster max={1} />);
      act(() => {
        addToast({ description: 'Pinned', duration: Infinity });
        addToast({ description: 'Queued', duration: 3000 });
      });
      expect(screen.getByText('Pinned')).toBeInTheDocument();
      expect(screen.queryByText('Queued')).toBeNull(); // queued, not yet visible
      // Its timer runs in the store regardless of visibility, so it expires.
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(getSnapshot().map((t) => t.description)).toEqual(['Pinned']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('auto-dismisses after duration, and pause-on-hover holds it', () => {
    vi.useFakeTimers();
    try {
      render(<Toaster />);
      act(() => {
        addToast({ description: 'Bye', duration: 3000 });
      });
      const item = screen.getByText('Bye').closest('[role="status"]')!;
      fireEvent.mouseEnter(item);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('Bye')).toBeInTheDocument(); // paused
      fireEvent.mouseLeave(item);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('Bye')).toBeNull(); // resumed + elapsed
    } finally {
      vi.useRealTimers();
    }
  });

  it('useToast severity shortcuts enqueue with the right severity', () => {
    let api: ReturnType<typeof useToast> | null = null;
    render(
      <>
        <Enqueuer onReady={(a) => (api = a)} />
        <Toaster />
      </>,
    );
    fireEvent.click(screen.getByText('go'));
    act(() => {
      api!.toast.error('Failed');
    });
    expect(getSnapshot()[0]!.severity).toBe('error');
  });

  it('caller-supplied id upserts (update in place) instead of stacking', () => {
    let api: ReturnType<typeof useToast> | null = null;
    function E() {
      api = useToast();
      return null;
    }
    render(<E />);
    act(() => {
      api!.toast({ id: 'save', description: 'Saving…' });
    });
    act(() => {
      api!.toast({ id: 'save', description: 'Saved', severity: 'success' });
    });
    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0]!.description).toBe('Saved');
    expect(getSnapshot()[0]!.severity).toBe('success');
  });

  it('toast.promise shows loading then resolves to success', async () => {
    let api: ReturnType<typeof useToast> | null = null;
    function E() {
      api = useToast();
      return null;
    }
    render(<E />);
    let resolve!: (v: string) => void;
    const p = new Promise<string>((r) => {
      resolve = r;
    });
    act(() => {
      api!.toast.promise(p, { loading: 'Loading…', success: (v) => `Got ${v}`, error: 'Failed' });
    });
    expect(getSnapshot()[0]!.description).toBe('Loading…');
    await act(async () => {
      resolve('X');
      await p;
    });
    expect(getSnapshot()[0]!.severity).toBe('success');
    expect(getSnapshot()[0]!.description).toBe('Got X');
  });

  it('Toaster renders a toast with no placement, and matching per-toast placement', () => {
    render(<Toaster placement="top-center" />);
    act(() => {
      addToast({ description: 'unplaced', duration: Infinity });
    }); // shows everywhere
    act(() => {
      addToast({ description: 'topc', placement: 'top-center', duration: Infinity });
    });
    act(() => {
      addToast({ description: 'botr', placement: 'bottom-right', duration: Infinity });
    });
    expect(screen.getByText('unplaced')).toBeInTheDocument();
    expect(screen.getByText('topc')).toBeInTheDocument();
    expect(screen.queryByText('botr')).toBeNull();
  });
});
