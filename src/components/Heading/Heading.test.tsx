import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders the semantic tag for the level', () => {
    render(<Heading level={3}>Title</Heading>);
    const el = screen.getByRole('heading', { level: 3 });
    expect(el.tagName).toBe('H3');
  });
  it('visual size defaults from level but can be overridden', () => {
    const { rerender } = render(
      <Heading level={2} data-testid="h">
        T
      </Heading>,
    );
    expect(screen.getByTestId('h')).toHaveAttribute('data-size', 'xl'); // default for level 2
    rerender(
      <Heading level={2} size="sm" data-testid="h">
        T
      </Heading>,
    );
    expect(screen.getByTestId('h')).toHaveAttribute('data-size', 'sm');
  });
  it('forwards className + DOM props', () => {
    render(
      <Heading level={1} className="x" id="pg">
        T
      </Heading>,
    );
    const el = screen.getByRole('heading', { level: 1 });
    expect(el).toHaveClass('x');
    expect(el).toHaveAttribute('id', 'pg');
  });
  it('applies the leading data-attr (default tight)', () => {
    const { rerender } = render(
      <Heading level={2} data-testid="h">
        T
      </Heading>,
    );
    expect(screen.getByTestId('h')).toHaveAttribute('data-leading', 'tight');
    rerender(
      <Heading level={2} leading="relaxed" data-testid="h">
        T
      </Heading>,
    );
    expect(screen.getByTestId('h')).toHaveAttribute('data-leading', 'relaxed');
  });
});
