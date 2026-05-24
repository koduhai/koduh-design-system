import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Box } from './Box';

describe('Box', () => {
  it('renders a div, forwards className/DOM props', () => {
    render(
      <Box className="x" data-testid="b" aria-label="region">
        c
      </Box>,
    );
    const el = screen.getByTestId('b');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('x');
  });
  it('maps padding/px/py to space-token custom properties', () => {
    render(
      <Box padding={4} px={6} py={2} data-testid="b">
        c
      </Box>,
    );
    const el = screen.getByTestId('b');
    expect(el.style.getPropertyValue('--box-p')).toBe('var(--ku-space-4)');
    expect(el.style.getPropertyValue('--box-px')).toBe('var(--ku-space-6)');
    expect(el.style.getPropertyValue('--box-py')).toBe('var(--ku-space-2)');
  });
  it('grow/shrink/minWidth/width as data-attrs/props', () => {
    render(
      <Box grow shrink={false} minWidth={0} width="200px" data-testid="b">
        c
      </Box>,
    );
    const el = screen.getByTestId('b');
    expect(el).toHaveAttribute('data-grow', '');
    expect(el).toHaveAttribute('data-shrink', 'false');
    expect(el.style.getPropertyValue('--box-min-width')).toBe('0');
    expect(el.style.getPropertyValue('--box-width')).toBe('200px');
  });
  it('renders the consumer element with asChild', () => {
    render(
      <Box asChild>
        <section data-testid="b">c</section>
      </Box>,
    );
    expect(screen.getByTestId('b').tagName).toBe('SECTION');
  });
});
