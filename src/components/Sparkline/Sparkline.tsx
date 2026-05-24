import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import { cx } from '../../utils/cx';
import styles from './Sparkline.module.css';

export type SparklineType = 'line' | 'area' | 'bar';

export interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, 'type'> {
  /** Numeric series to plot. An empty array renders an empty (but labeled) svg. */
  data: number[];
  /** Shape to draw. Defaults to 'line'. */
  type?: SparklineType;
  /** SVG width in px. Defaults to 120. */
  width?: number;
  /** SVG height in px. Defaults to 32. */
  height?: number;
  /** Stroke/fill color. Defaults to the first categorical chart color. */
  color?: string;
  /**
   * Accessible label. When omitted, a generic summary is generated from the
   * data so the graphic is never unlabeled.
   */
  'aria-label'?: string;
}

/** Vertical padding so stroke width / point markers are not clipped. */
const PAD = 2;

/** Map a data series to evenly spaced [x, y] coordinates within the viewport. */
function toPoints(data: number[], width: number, height: number): Array<[number, number]> {
  const n = data.length;
  if (n === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1; // avoid divide-by-zero for a flat series
  const innerH = Math.max(height - PAD * 2, 0);
  const stepX = n > 1 ? width / (n - 1) : 0;

  return data.map((value, i) => {
    const x = n > 1 ? i * stepX : width / 2;
    // SVG y grows downward, so invert the normalized value.
    const y = PAD + innerH - ((value - min) / span) * innerH;
    return [x, y];
  });
}

export const Sparkline = /* @__PURE__ */ forwardRef<SVGSVGElement, SparklineProps>(
  function Sparkline(
    {
      data,
      type = 'line',
      width = 120,
      height = 32,
      color = 'var(--ku-color-chart-1)',
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) {
    const points = toPoints(data, width, height);
    const label =
      ariaLabel ??
      (data.length > 0
        ? `Sparkline of ${data.length} values, from ${data[0]} to ${data[data.length - 1]}`
        : 'Sparkline, no data');

    return (
      <svg
        ref={ref}
        className={cx(styles.root, className)}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        data-type={type}
        {...props}
      >
        {type === 'bar'
          ? renderBars(data, width, height, color)
          : renderPath(points, type, height, color)}
      </svg>
    );
  },
);

function renderPath(
  points: Array<[number, number]>,
  type: SparklineType,
  height: number,
  color: string,
) {
  if (points.length === 0) return null;

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

  if (type === 'area') {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const baseline = height - PAD;
    const area = `${line} L${last[0]} ${baseline} L${first[0]} ${baseline} Z`;
    return (
      <>
        <path d={area} fill={color} fillOpacity={0.18} stroke="none" aria-hidden />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        />
      </>
    );
  }

  return (
    <path
      d={line}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    />
  );
}

function renderBars(data: number[], width: number, height: number, color: string) {
  const n = data.length;
  if (n === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const innerH = Math.max(height - PAD * 2, 0);
  const gap = n > 1 ? Math.min(2, width / n / 4) : 0;
  const barW = Math.max(width / n - gap, 0.5);

  return (
    <>
      {data.map((value, i) => {
        const h = ((value - min) / span) * innerH;
        const x = i * (width / n) + gap / 2;
        const y = PAD + innerH - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(h, 0.5)}
            fill={color}
            rx={0.5}
            aria-hidden
          />
        );
      })}
    </>
  );
}
