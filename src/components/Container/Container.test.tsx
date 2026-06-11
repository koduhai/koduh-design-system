import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';
import type { SpaceToken } from './index';

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
  it('py sets the vertical-padding custom property', () => {
    render(
      <Container py={8} data-testid="c">
        x
      </Container>,
    );
    expect(screen.getByTestId('c').style.getPropertyValue('--container-py')).toBe(
      'var(--ku-space-8)',
    );
  });
  it('exports SpaceToken so consumers can type a py value', () => {
    // Compile-time check: SpaceToken must be importable from the component
    // index (matching the sibling layout components) and accepted by py.
    const py: SpaceToken = 8;
    render(
      <Container py={py} data-testid="c">
        x
      </Container>,
    );
    expect(screen.getByTestId('c').style.getPropertyValue('--container-py')).toBe(
      'var(--ku-space-8)',
    );
  });
});
