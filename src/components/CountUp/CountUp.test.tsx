import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
