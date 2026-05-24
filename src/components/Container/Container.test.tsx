import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('defaults to size lg and padded', () => {
    render(<Container data-testid="c">a</Container>);
    const el = screen.getByTestId('c');
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-padded', 'true');
  });
  it('honors size and padded={false}', () => {
    render(
      <Container size="sm" padded={false} data-testid="c">
        a
      </Container>,
    );
    const el = screen.getByTestId('c');
    expect(el).toHaveAttribute('data-size', 'sm');
    expect(el).not.toHaveAttribute('data-padded');
  });
  it('forwards className + asChild', () => {
    render(
      <Container asChild className="x">
        <main data-testid="c">a</main>
      </Container>,
    );
    const el = screen.getByTestId('c');
    expect(el.tagName).toBe('MAIN');
    expect(el).toHaveClass('x');
  });
});
