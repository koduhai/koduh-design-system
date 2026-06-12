import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Meter.module.css';

export type MeterSize = 'sm' | 'md';

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** The current numeric measurement. */
  value: number;
  /** Lower bound. Default 0. */
  min?: number;
  /** Upper bound. Default 100. */
  max?: number;
  /** Upper bound of the low (often "poor") range. */
  low?: number;
  /** Lower bound of the high (often "poor") range. */
  high?: number;
  /** The optimal value; its position relative to `low`/`high` determines which band is "good". */
  optimum?: number;
  /** Accessible name; rendered and wired via aria-labelledby when provided. */
  label?: ReactNode;
  /** Formats `value` for `aria-valuetext` and the optional visible readout. */
  formatValue?: (value: number) => string;
  /** Track thickness. Default 'md'. */
  size?: MeterSize;
  /** Render the formatted value as visible text. Default false. */
  showValue?: boolean;
}

/** Clamp `n` into [min,max]; returns `min` when `n` is non-finite. */
function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/**
 * WHATWG `<meter>` coloring. Returns the qualitative band for `value`.
 * Per the spec's "constrained" steps, `low`/`high`/`optimum` are clamped into
 * [min,max] and `low` is held to `high` before grading.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element
 */
export function meterTone(
  value: number,
  min: number,
  max: number,
  low?: number,
  high?: number,
  optimum?: number,
): 'good' | 'caution' | 'poor' | 'neutral' {
  if (low === undefined && high === undefined && optimum === undefined) return 'neutral';
  const lo = clamp(low ?? min, min, max);
  // high is constrained to be >= low (spec: "If high is less than low, let high be low").
  const hi = Math.max(clamp(high ?? max, min, max), lo);
  if (optimum !== undefined) optimum = clamp(optimum, min, max);
  if (optimum === undefined) {
    // no optimum: in [lo,hi] is good, outside is caution
    return value >= lo && value <= hi ? 'good' : 'caution';
  }
  // Determine preferred region of optimum, then grade value by distance band.
  if (optimum < lo) {
    // lower is better
    if (value <= lo) return 'good';
    if (value <= hi) return 'caution';
    return 'poor';
  }
  if (optimum > hi) {
    // higher is better
    if (value >= hi) return 'good';
    if (value >= lo) return 'caution';
    return 'poor';
  }
  // middle is best
  if (value >= lo && value <= hi) return 'good';
  return 'caution';
}

export const Meter = /* @__PURE__ */ forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    value,
    min = 0,
    max = 100,
    low,
    high,
    optimum,
    label,
    formatValue,
    size = 'md',
    showValue = false,
    className,
    ...props
  },
  ref,
) {
  const labelId = useId('meter-label');
  const hasLabel = label != null;
  const span = max - min;
  const pct = span <= 0 ? 0 : Math.min(Math.max(((value - min) / span) * 100, 0), 100);
  const tone = meterTone(value, min, max, low, high, optimum);
  const valueText = formatValue?.(value);
  // Keep the announced value consistent with the visual fill: clamp into
  // [min,max] and treat non-finite input as `min` so aria-valuenow is valid.
  const clampedValue = span <= 0 ? min : clamp(value, min, max);

  if (process.env.NODE_ENV !== 'production') {
    const hasName = hasLabel || props['aria-label'] != null || props['aria-labelledby'] != null;
    if (!hasName) {
      console.warn(
        'Meter: provide a `label`, `aria-label`, or `aria-labelledby` so role="meter" has an accessible name.',
      );
    }
  }

  const showLabelRow = hasLabel || (showValue && valueText != null);

  return (
    <div ref={ref} className={cx(styles.root, className)} data-size={size}>
      {showLabelRow ? (
        <div className={styles.labelRow} data-labelled={hasLabel ? '' : undefined}>
          {hasLabel ? (
            <span id={labelId} className={styles.label}>
              {label}
            </span>
          ) : null}
          {showValue && valueText != null ? (
            <span className={styles.value}>{valueText}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={styles.track}
        role="meter"
        data-tone={tone}
        aria-valuenow={clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-labelledby={hasLabel ? labelId : undefined}
        style={{ '--meter-pct': `${pct}%` } as CSSProperties}
        {...props}
      >
        <div className={styles.fill} />
      </div>
    </div>
  );
});
