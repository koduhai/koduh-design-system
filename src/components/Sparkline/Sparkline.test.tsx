import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from './Sparkline';

const data = [1, 3, 2, 5, 4];

describe('Sparkline', () => {
  it('renders an svg with role="img" and the provided aria-label', () => {
    render(<Sparkline data={data} aria-label="Sales trend" />);
    const svg = screen.getByRole('img', { name: 'Sales trend' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('generates an accessible label from the data when none is given', () => {
    render(<Sparkline data={data} />);
    // first → last values appear in the generated label
    const svg = screen.getByRole('img', { name: /from 1 to 4/i });
    expect(svg).toBeInTheDocument();
  });

  it('defaults to a single line path for type="line"', () => {
    const { container } = render(<Sparkline data={data} aria-label="x" />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0]?.getAttribute('d')).toMatch(/^M/);
    expect(container.querySelector('svg')).toHaveAttribute('data-type', 'line');
  });

  it('renders an area fill plus a line stroke for type="area"', () => {
    const { container } = render(<Sparkline data={data} type="area" aria-label="x" />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    // closed area path ends with Z
    expect(paths[0]?.getAttribute('d')).toMatch(/Z$/);
  });

  it('renders one rect per datum for type="bar"', () => {
    const { container } = render(<Sparkline data={data} type="bar" aria-label="x" />);
    expect(container.querySelectorAll('rect')).toHaveLength(data.length);
  });

  it('applies the default chart-1 color and respects a custom color', () => {
    const { container, rerender } = render(<Sparkline data={data} aria-label="x" />);
    expect(container.querySelector('path')).toHaveAttribute('stroke', 'var(--ku-color-chart-1)');
    rerender(<Sparkline data={data} color="var(--ku-color-chart-5)" aria-label="x" />);
    expect(container.querySelector('path')).toHaveAttribute('stroke', 'var(--ku-color-chart-5)');
  });

  it('marks decorative shapes aria-hidden', () => {
    const { container } = render(<Sparkline data={data} type="bar" aria-label="x" />);
    container.querySelectorAll('rect').forEach((rect) => {
      expect(rect).toHaveAttribute('aria-hidden');
    });
  });

  it('honors width/height and applies the viewBox', () => {
    const { container } = render(<Sparkline data={data} width={200} height={50} aria-label="x" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '50');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 50');
  });

  it('renders an empty but labeled svg for empty data', () => {
    const { container } = render(<Sparkline data={[]} />);
    const svg = screen.getByRole('img', { name: /no data/i });
    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll('path, rect')).toHaveLength(0);
  });

  it('draws a visible flat segment for a single-datum line series', () => {
    const { container } = render(<Sparkline data={[7]} width={120} aria-label="x" />);
    const d = container.querySelector('path')?.getAttribute('d') ?? '';
    // A lone moveto would draw nothing; expect a line across the full width.
    expect(d).toMatch(/^M0 /);
    expect(d).toContain('L120 ');
    expect(d).not.toContain('NaN');
  });

  it('draws a visible area for a single-datum area series', () => {
    const { container } = render(<Sparkline data={[7]} type="area" width={120} aria-label="x" />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    const areaD = paths[0]?.getAttribute('d') ?? '';
    expect(areaD).toMatch(/Z$/);
    expect(areaD).toContain('L120 ');
    expect(areaD).not.toContain('NaN');
  });

  it('does not emit NaN coordinates when data contains non-finite values', () => {
    const dirty = [1, NaN, Infinity, -Infinity, 4];
    (['line', 'area', 'bar'] as const).forEach((type) => {
      const { container } = render(<Sparkline data={dirty} type={type} aria-label="x" />);
      container.querySelectorAll('path').forEach((p) => {
        expect(p.getAttribute('d')).not.toContain('NaN');
      });
      container.querySelectorAll('rect').forEach((r) => {
        ['x', 'y', 'width', 'height'].forEach((attr) => {
          expect(r.getAttribute(attr)).not.toContain('NaN');
        });
      });
    });
  });

  it('omits NaN from the generated label when data has non-finite values', () => {
    render(<Sparkline data={[NaN, 2, 3]} />);
    // Leading NaN is coerced to a finite baseline of 0, so the label reads "from 0".
    const svg = screen.getByRole('img', { name: /from 0 to 3/i });
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('aria-label')).not.toContain('NaN');
  });

  it('forwards a ref to the svg element', () => {
    const ref = { current: null as SVGSVGElement | null };
    render(<Sparkline data={data} ref={ref} aria-label="x" />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });
});
