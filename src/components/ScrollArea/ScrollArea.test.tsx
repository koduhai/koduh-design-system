import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from './ScrollArea';

/** jsdom reports scrollHeight/clientHeight as 0, so force an overflow delta. */
function stubOverflow(el: HTMLElement, axis: 'y' | 'x') {
  const scrollProp = axis === 'y' ? 'scrollHeight' : 'scrollWidth';
  const clientProp = axis === 'y' ? 'clientHeight' : 'clientWidth';
  Object.defineProperty(el, scrollProp, { configurable: true, value: 500 });
  Object.defineProperty(el, clientProp, { configurable: true, value: 100 });
}

describe('ScrollArea', () => {
  it('defaults to vertical orientation', () => {
    render(
      <ScrollArea data-testid="sa">
        <p>Content</p>
      </ScrollArea>,
    );
    const root = screen.getByTestId('sa');
    expect(root).toHaveAttribute('data-orientation', 'vertical');
  });

  it('is not a tab stop when content fits (no overflow)', () => {
    render(
      <ScrollArea data-testid="sa">
        <p>Content</p>
      </ScrollArea>,
    );
    // jsdom reports zero scroll/client size, so the area never overflows.
    expect(screen.getByTestId('sa')).not.toHaveAttribute('tabindex');
  });

  it('becomes keyboard-focusable once the content overflows', () => {
    let el: HTMLElement | null = null;
    render(
      <ScrollArea
        data-testid="sa"
        ref={(node) => {
          el = node;
          if (node) stubOverflow(node, 'y');
        }}
      >
        <p>Content</p>
      </ScrollArea>,
    );
    expect(el).not.toBeNull();
    expect(screen.getByTestId('sa')).toHaveAttribute('tabindex', '0');
  });

  it('measures the horizontal axis for horizontal orientation', () => {
    render(
      <ScrollArea
        data-testid="sa"
        orientation="horizontal"
        ref={(node) => {
          if (node) stubOverflow(node, 'x');
        }}
      >
        <p>Content</p>
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveAttribute('tabindex', '0');
  });

  it('reflects the orientation prop as a data attribute', () => {
    render(
      <ScrollArea data-testid="sa" orientation="both">
        <p>Content</p>
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveAttribute('data-orientation', 'both');
  });

  it('applies a numeric maxHeight as px', () => {
    render(
      <ScrollArea data-testid="sa" maxHeight={200}>
        <p>Content</p>
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveStyle({ maxHeight: '200px' });
  });

  it('applies a string maxHeight verbatim', () => {
    render(
      <ScrollArea data-testid="sa" maxHeight="50vh">
        <p>Content</p>
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveStyle({ maxHeight: '50vh' });
  });

  it('merges consumer style and allows overriding tabIndex', () => {
    render(
      <ScrollArea data-testid="sa" tabIndex={-1} style={{ background: 'red' }}>
        <p>Content</p>
      </ScrollArea>,
    );
    const root = screen.getByTestId('sa');
    expect(root).toHaveAttribute('tabindex', '-1');
    expect(root).toHaveStyle({ background: 'red' });
  });

  it('forwards ref and renders children', () => {
    const ref = vi.fn();
    render(
      <ScrollArea ref={ref}>
        <span>Hello</span>
      </ScrollArea>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(ref).toHaveBeenCalled();
  });
});
