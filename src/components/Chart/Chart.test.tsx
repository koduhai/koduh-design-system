import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Chart } from './Chart';

const single = [{ name: 'Signups', data: [1, 3, 2, 5] }];
const multi = [
  { name: 'A', data: [1, 2, 3] },
  { name: 'B', data: [3, 2, 1] },
];

describe('Chart', () => {
  it('renders an svg with role="img" and the provided aria-label', () => {
    render(<Chart series={single} aria-label="My chart" />);
    expect(screen.getByRole('img', { name: 'My chart' })).toBeInTheDocument();
  });

  it('generates a label listing the series names when none is given', () => {
    render(<Chart series={multi} />);
    const svg = screen.getByRole('img', { name: /A, B/ });
    expect(svg).toBeInTheDocument();
  });

  it('uses the invariant "series" wording in the generated label for a single series', () => {
    render(<Chart series={single} type="line" />);
    expect(screen.getByRole('img', { name: /1 series: Signups/ })).toBeInTheDocument();
  });

  it('draws one path per series for a line chart', () => {
    const { container } = render(<Chart series={multi} type="line" aria-label="x" />);
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('starts each line path with a move command', () => {
    const { container } = render(<Chart series={single} type="line" aria-label="x" />);
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
  });

  it('draws series.length * data.length rects for a bar chart', () => {
    const { container } = render(<Chart series={multi} type="bar" aria-label="x" />);
    // 2 series x 3 points = 6 bars
    expect(container.querySelectorAll('rect')).toHaveLength(6);
  });

  it('colors series from the chart palette by index, wrapping past 8', () => {
    const eight = Array.from({ length: 9 }, (_, i) => ({ name: `s${i}`, data: [1, 2] }));
    const { container } = render(<Chart series={eight} type="line" aria-label="x" />);
    const paths = container.querySelectorAll('path');
    expect(paths[0]).toHaveAttribute('stroke', 'var(--ku-color-chart-1)');
    expect(paths[7]).toHaveAttribute('stroke', 'var(--ku-color-chart-8)');
    // 9th series wraps back to chart-1
    expect(paths[8]).toHaveAttribute('stroke', 'var(--ku-color-chart-1)');
  });

  it('uses an explicit series color when provided', () => {
    const { container } = render(
      <Chart
        series={[{ name: 'x', data: [1, 2], color: 'var(--ku-color-chart-5)' }]}
        aria-label="x"
      />,
    );
    expect(container.querySelector('path')).toHaveAttribute('stroke', 'var(--ku-color-chart-5)');
  });

  it('renders axis lines by default and omits them when showAxes is false', () => {
    const { container, rerender } = render(<Chart series={single} aria-label="x" />);
    expect(container.querySelectorAll('line')).toHaveLength(2);
    rerender(<Chart series={single} showAxes={false} aria-label="x" />);
    expect(container.querySelectorAll('line')).toHaveLength(0);
  });

  it('provides a visually-hidden data table summary with categories', () => {
    render(<Chart series={multi} categories={['Q1', 'Q2', 'Q3']} aria-label="x" />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Q1')).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'A' })).toBeInTheDocument();
  });

  it('marks the svg drawing primitives aria-hidden', () => {
    const { container } = render(<Chart series={single} type="bar" aria-label="x" />);
    container.querySelectorAll('rect').forEach((r) => {
      // bars are wrapped in an aria-hidden group
      expect(r.closest('[aria-hidden]')).not.toBeNull();
    });
  });

  it('honors width/height and applies the viewBox', () => {
    const { container } = render(<Chart series={single} width={400} height={200} aria-label="x" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '400');
    expect(svg).toHaveAttribute('viewBox', '0 0 400 200');
  });

  it('keeps a multi-series bar cluster within its category slot (no overflow)', () => {
    // Many narrow series in a small chart used to overflow because the per-series
    // stride was derived from a floored barW rather than from groupW.
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `s${i}`, data: [1, 2] }));
    const width = 120;
    const height = 80;
    const { container } = render(
      <Chart series={many} type="bar" width={width} height={height} aria-label="x" />,
    );
    const PAD = 8;
    const plotW = width - PAD * 2;
    const groupCount = 2;
    const groupW = plotW / groupCount;
    const rects = Array.from(container.querySelectorAll('rect'));
    rects.forEach((r) => {
      const x = Number(r.getAttribute('x'));
      const w = Number(r.getAttribute('width'));
      const slot = Math.floor((x - PAD) / groupW);
      const slotStart = PAD + slot * groupW;
      const slotEnd = slotStart + groupW;
      // each bar stays inside its category slot (allow a sub-pixel epsilon)
      expect(x).toBeGreaterThanOrEqual(slotStart - 0.01);
      expect(x + w).toBeLessThanOrEqual(slotEnd + 0.01);
    });
  });

  it('centers a single-series bar within its category slot', () => {
    const width = 120;
    const height = 80;
    const { container } = render(
      <Chart series={single} type="bar" width={width} height={height} aria-label="x" />,
    );
    const PAD = 8;
    const plotW = width - PAD * 2;
    const groupCount = single[0]!.data.length;
    const groupW = plotW / groupCount;
    const firstRect = container.querySelector('rect')!;
    const x = Number(firstRect.getAttribute('x'));
    const w = Number(firstRect.getAttribute('width'));
    const slotCenter = PAD + groupW / 2;
    const barCenter = x + w / 2;
    expect(barCenter).toBeCloseTo(slotCenter, 5);
  });

  it('forwards a ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Chart series={single} ref={ref} aria-label="x" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
