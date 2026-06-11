import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { VisuallyHidden } from '../../primitives';
import styles from './Chart.module.css';

export type ChartType = 'line' | 'bar';

export interface ChartSeries {
  /** Series name, used in the accessible summary. */
  name: string;
  /** Numeric values; aligned by index with `categories` when provided. */
  data: number[];
  /** Override color. Defaults to `--ku-color-chart-N` by series index. */
  color?: string;
}

export interface ChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** One or more data series. */
  series: ChartSeries[];
  /** Render style. Defaults to 'line'. */
  type?: ChartType;
  /** X-axis category labels, aligned by index with each series' data. */
  categories?: string[];
  /** Chart width in px. Defaults to 320. */
  width?: number;
  /** Chart height in px. Defaults to 180. */
  height?: number;
  /** Draw x/y axis lines. Defaults to true. */
  showAxes?: boolean;
  /** Accessible label. Falls back to a generated series summary. */
  'aria-label'?: string;
}

/** Inner plot padding: room for axes + so strokes/points aren't clipped. */
const PAD = { top: 8, right: 8, bottom: 8, left: 8 };

/** Resolve the color for a series: explicit override, else chart-N by index. */
function seriesColor(s: ChartSeries, index: number): string {
  if (s.color) return s.color;
  // 8-color categorical palette, wrapping past 8 series.
  return `var(--ku-color-chart-${(index % 8) + 1})`;
}

function bounds(series: ChartSeries[]): { min: number; max: number; maxLen: number } {
  let min = Infinity;
  let max = -Infinity;
  let maxLen = 0;
  for (const s of series) {
    maxLen = Math.max(maxLen, s.data.length);
    for (const v of s.data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }
  return { min, max, maxLen };
}

export const Chart = /* @__PURE__ */ forwardRef<HTMLDivElement, ChartProps>(function Chart(
  {
    series,
    type = 'line',
    categories,
    width = 320,
    height = 180,
    showAxes = true,
    className,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const { min, max, maxLen } = bounds(series);
  const span = max - min || 1;

  const plotW = Math.max(width - PAD.left - PAD.right, 0);
  const plotH = Math.max(height - PAD.top - PAD.bottom, 0);
  const baseY = PAD.top + plotH;

  // x position helpers
  const lineX = (i: number, len: number) =>
    PAD.left + (len > 1 ? (i / (len - 1)) * plotW : plotW / 2);
  const valueY = (v: number) => PAD.top + plotH - ((v - min) / span) * plotH;

  const label =
    ariaLabel ??
    `${type} chart with ${series.length} series: ${series.map((s) => s.name).join(', ')}`;

  // group bars: each category gets a cluster of one bar per series.
  // The per-series stride is derived from groupW (not from a floored barW) so the
  // cluster always fits inside one category slot and never overflows into the next.
  const groupCount = maxLen || 1;
  const groupW = plotW / groupCount;
  const barGap = 2;
  const barStride = series.length > 0 ? groupW / series.length : 0;
  // Keep at least a hairline of bar; never let barW exceed its own stride.
  const barW = series.length > 0 ? Math.min(Math.max(barStride - barGap, 0.5), barStride) : 0;

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      <svg
        className={styles.svg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {showAxes ? (
          <g className={styles.axes} aria-hidden>
            {/* y axis */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseY} />
            {/* x axis */}
            <line x1={PAD.left} y1={baseY} x2={PAD.left + plotW} y2={baseY} />
          </g>
        ) : null}

        {series.map((s, si) => {
          const color = seriesColor(s, si);
          if (type === 'bar') {
            return (
              <g key={s.name + si} aria-hidden>
                {s.data.map((v, i) => {
                  const h = ((v - min) / span) * plotH;
                  // Center each bar within its stride; the cluster spans exactly
                  // groupW and sits under the same x as the line/axis category.
                  const x = PAD.left + i * groupW + si * barStride + (barStride - barW) / 2;
                  const y = baseY - h;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(h, 0.5)}
                      fill={color}
                      rx={1}
                    />
                  );
                })}
              </g>
            );
          }

          const d = s.data
            .map((v, i) => `${i === 0 ? 'M' : 'L'}${lineX(i, s.data.length)} ${valueY(v)}`)
            .join(' ');
          return (
            <path
              key={s.name + si}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            />
          );
        })}
      </svg>

      <VisuallyHidden>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Series</th>
              {Array.from({ length: maxLen }, (_, i) => (
                <th scope="col" key={i}>
                  {categories?.[i] ?? `Point ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s, si) => (
              <tr key={s.name + si}>
                <th scope="row">{s.name}</th>
                {Array.from({ length: maxLen }, (_, i) => (
                  <td key={i}>{s.data[i] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </div>
  );
});
