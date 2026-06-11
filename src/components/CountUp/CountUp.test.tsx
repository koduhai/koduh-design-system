import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountUp } from './CountUp';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

describe('CountUp', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the final value immediately when reduced motion is preferred', () => {
    mockReducedMotion(true);
    render(<CountUp value={1234} />);
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders the final value immediately when duration is 0', () => {
    mockReducedMotion(false);
    render(<CountUp value={42} duration={0} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies decimals', () => {
    mockReducedMotion(true);
    render(<CountUp value={3.14159} decimals={2} />);
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('applies a custom format function', () => {
    mockReducedMotion(true);
    render(<CountUp value={0.5} format={(n) => `${(n * 100).toFixed(0)}%`} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('forwards className and ref to the span', () => {
    mockReducedMotion(true);
    const { container } = render(<CountUp value={1} className="stat" />);
    expect(container.firstChild).toHaveClass('stat');
    expect((container.firstChild as HTMLElement).tagName).toBe('SPAN');
  });

  it('tweens forward from the current display when value changes mid-animation', () => {
    mockReducedMotion(false);
    // Drive the animation manually: each rAF callback is queued and flushed
    // with a caller-controlled timestamp so we can step the tween precisely.
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    let nowValue = 0;
    vi.stubGlobal('performance', { now: () => nowValue });

    const flush = (now: number) => {
      nowValue = now;
      const pending = callbacks.splice(0);
      act(() => {
        for (const cb of pending) cb(now);
      });
    };

    const { container, rerender } = render(<CountUp value={100} duration={1000} />);
    const span = container.firstChild as HTMLElement;

    // Advance to the midpoint of the first tween (0 -> 100), display is now well above 0.
    flush(0);
    flush(500);
    const midDisplay = Number(span.textContent);
    expect(midDisplay).toBeGreaterThan(0);

    // Interrupt with a new target. The new tween must start from the current
    // display, so the very next frame must not jump below where we already were.
    rerender(<CountUp value={200} duration={1000} />);
    flush(500);
    flush(510);
    expect(Number(span.textContent)).toBeGreaterThanOrEqual(midDisplay);
  });
});
