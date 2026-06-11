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

  // Regression: a sizeless rect/circle previously collapsed to height:0 (an
  // invisible, and for circle non-circular, placeholder). The variant rules now
  // declare a default width/height so an omitted size still renders a box. An
  // inline width/height (style prop) still overrides the CSS default.
  it('rect/circle variants declare a default size in CSS', () => {
    const css = readFileSync(join(__dirname, 'Skeleton.module.css'), 'utf8');
    const rect = css.match(/\.root\[data-variant='rect'\]\s*\{([^}]*)\}/);
    const circle = css.match(/\.root\[data-variant='circle'\]\s*\{([^}]*)\}/);
    expect(rect?.[1]).toMatch(/height:/);
    expect(circle?.[1]).toMatch(/width:/);
    expect(circle?.[1]).toMatch(/height:/);
  });

  it('still applies an explicit inline size over the variant default', () => {
    const { container } = render(<Skeleton variant="circle" width={48} height={48} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('48px');
    expect(el.style.height).toBe('48px');
  });
});
