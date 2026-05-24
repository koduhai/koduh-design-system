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
  it('sets --inline-gap from the token', () => {
    render(
      <Inline gap={2} data-testid="i">
        a
      </Inline>,
    );
    expect(screen.getByTestId('i').style.getPropertyValue('--inline-gap')).toBe(
      'var(--ku-space-2)',
    );
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
