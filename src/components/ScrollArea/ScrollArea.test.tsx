import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from './ScrollArea';

describe('ScrollArea', () => {
  it('defaults to vertical orientation and is keyboard-focusable', () => {
    render(
      <ScrollArea data-testid="sa">
        <p>Content</p>
      </ScrollArea>,
    );
    const root = screen.getByTestId('sa');
    expect(root).toHaveAttribute('data-orientation', 'vertical');
    expect(root).toHaveAttribute('tabindex', '0');
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
