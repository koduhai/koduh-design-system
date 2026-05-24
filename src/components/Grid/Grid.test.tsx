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
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-template')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
  });
  it('uses auto-fit minmax when minItemWidth is set', () => {
    render(
      <Grid minItemWidth="200px" data-testid="g">
        a
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-template')).toBe(
      'repeat(auto-fit, minmax(200px, 1fr))',
    );
  });
  it('columns wins when both are given', () => {
    render(
      <Grid columns={2} minItemWidth="200px" data-testid="g">
        a
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--grid-template')).toBe(
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
    expect(el.style.getPropertyValue('--grid-gap')).toBe('var(--ku-space-6)');
  });
});
