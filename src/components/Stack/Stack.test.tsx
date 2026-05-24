import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders children in a div root and forwards className + DOM props', () => {
    render(
      <Stack className="x" data-testid="s" aria-label="group">
        <span>a</span>
      </Stack>,
    );
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('x');
    expect(el).toHaveAttribute('aria-label', 'group');
  });

  it('sets the gap custom property from the space token', () => {
    render(
      <Stack gap={6} data-testid="s">
        a
      </Stack>,
    );
    expect(screen.getByTestId('s').style.getPropertyValue('--stack-gap')).toBe('var(--ku-space-6)');
  });

  it('reflects align/justify/wrap as data-attributes', () => {
    render(
      <Stack align="center" justify="between" wrap data-testid="s">
        a
      </Stack>,
    );
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap', '');
  });

  it('renders the consumer element when asChild', () => {
    render(
      <Stack asChild>
        <section data-testid="s">a</section>
      </Stack>,
    );
    expect(screen.getByTestId('s').tagName).toBe('SECTION');
  });
});
