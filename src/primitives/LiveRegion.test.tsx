import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  it('renders a polite status region by default and announces its children', () => {
    render(<LiveRegion>Slide 2 of 5</LiveRegion>);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Slide 2 of 5');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('uses role=alert + aria-live=assertive when assertive', () => {
    render(<LiveRegion politeness="assertive">Saved</LiveRegion>);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('is visually hidden but in the accessibility tree', () => {
    render(<LiveRegion>x</LiveRegion>);
    const region = screen.getByRole('status');
    // VisuallyHidden recipe: 1px clipped box, never display:none.
    expect(region).toHaveStyle({ position: 'absolute', width: '1px' });
  });

  it('can opt out of aria-atomic', () => {
    render(<LiveRegion atomic={false}>x</LiveRegion>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'false');
  });
});
