import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid } from './Grid';

describe('Grid', () => {
  it('uses repeat(columns, 1fr) when columns is set', () => {
    render(
      <Grid columns={3} data-testid="g">
        a
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-cols-base')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
  });
  it('uses auto-fit minmax when minItemWidth is set', () => {
    render(
      <Grid minItemWidth="200px" data-testid="g">
        a
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-cols-base')).toBe(
      'repeat(auto-fit, minmax(200px, 1fr))',
    );
  });
  it('columns wins when both are given', () => {
    render(
      <Grid columns={2} minItemWidth="200px" data-testid="g">
        a
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-cols-base')).toBe(
      'repeat(2, minmax(0, 1fr))',
    );
  });
  it('sets the gap and forwards className', () => {
    render(
      <Grid gap={6} className="x" data-testid="g">
        a
      </Grid>,
    );
    const el = screen.getByTestId('g');
    expect(el).toHaveClass('x');
    expect(el.style.getPropertyValue('--grid-gap-base')).toBe('var(--ku-space-6)');
  });

  it('scalar columns still sets the base track (backward compatible)', () => {
    render(
      <Grid columns={3} data-testid="g">
        x
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-cols-base')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
  });
  it('responsive columns emit per-breakpoint custom properties', () => {
    render(
      <Grid columns={{ base: 1, md: 2 }} data-testid="g">
        x
      </Grid>,
    );
    const el = screen.getByTestId('g');
    expect(el.style.getPropertyValue('--grid-cols-base')).toBe('repeat(1, minmax(0, 1fr))');
    expect(el.style.getPropertyValue('--grid-cols-md')).toBe('repeat(2, minmax(0, 1fr))');
    expect(el.style.getPropertyValue('--grid-cols-sm')).toBe(''); // not provided
  });
  it('array columns become an fr track ratio', () => {
    render(
      <Grid columns={[1.1, 1]} data-testid="g">
        x
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-cols-base')).toBe('1.1fr 1fr');
  });
  it('responsive gap emits per-breakpoint gap vars', () => {
    render(
      <Grid gap={{ base: 3, md: 5 }} data-testid="g">
        x
      </Grid>,
    );
    const el = screen.getByTestId('g');
    expect(el.style.getPropertyValue('--grid-gap-base')).toBe('var(--ku-space-3)');
    expect(el.style.getPropertyValue('--grid-gap-md')).toBe('var(--ku-space-5)');
  });
});
