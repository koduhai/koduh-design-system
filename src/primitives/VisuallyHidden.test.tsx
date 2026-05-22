import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders content available to assistive tech but visually clipped', () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);
    const el = screen.getByText('Close menu');
    expect(el).toBeInTheDocument();
    expect(el.style.position).toBe('absolute');
    expect(el.style.width).toBe('1px');
  });
});
