import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inline } from './Inline';

describe('Inline', () => {
  it('forwards className + DOM props on a div root', () => {
    render(
      <Inline className="x" data-testid="i">
        a
      </Inline>,
    );
    expect(screen.getByTestId('i').tagName).toBe('DIV');
    expect(screen.getByTestId('i')).toHaveClass('x');
  });
  it('scalar gap still works (sets --inline-gap-base)', () => {
    render(
      <Inline gap={4} data-testid="i">
        a
      </Inline>,
    );
    expect(screen.getByTestId('i').style.getPropertyValue('--inline-gap-base')).toBe(
      'var(--ku-space-4)',
    );
  });
  it('responsive gap emits per-breakpoint vars', () => {
    render(
      <Inline gap={{ base: 2, md: 6 }} data-testid="i">
        a
      </Inline>,
    );
    const el = screen.getByTestId('i');
    expect(el.style.getPropertyValue('--inline-gap-base')).toBe('var(--ku-space-2)');
    expect(el.style.getPropertyValue('--inline-gap-md')).toBe('var(--ku-space-6)');
  });
  it('align baseline + as prop', () => {
    render(
      <Inline as="nav" align="baseline" data-testid="i">
        a
      </Inline>,
    );
    const el = screen.getByTestId('i');
    expect(el.tagName).toBe('NAV');
    expect(el).toHaveAttribute('data-align', 'baseline');
  });
  it('reflects align/justify/wrap and asChild', () => {
    render(
      <Inline asChild align="center" wrap>
        <nav data-testid="i">a</nav>
      </Inline>,
    );
    const el = screen.getByTestId('i');
    expect(el.tagName).toBe('NAV');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-wrap', '');
  });
});
