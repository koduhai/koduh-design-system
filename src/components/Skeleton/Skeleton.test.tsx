import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is decorative (aria-hidden)', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies width/height as inline styles (numbers → px)', () => {
    const { container } = render(<Skeleton width={120} height="2rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('2rem');
  });

  it('reflects variant as a data attribute', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstChild).toHaveAttribute('data-variant', 'circle');
  });

  // Regression: in the light theme bg-raised equals the white page background,
  // so the placeholder was invisible. The fill must use a token that differs
  // from the page background in both themes. (Vitest runs with css: false, so we
  // assert against the stylesheet source rather than computed styles.)
  it('fills the placeholder with the border token, not bg-raised', () => {
    const css = readFileSync(join(__dirname, 'Skeleton.module.css'), 'utf8');
    expect(css).toMatch(/background-color:\s*var\(--ku-color-border\)/);
    expect(css).not.toMatch(/background-color:\s*var\(--ku-color-bg-raised\)/);
  });
});
