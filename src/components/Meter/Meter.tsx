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

/**
 * WHATWG `<meter>` coloring. Returns the qualitative band for `value`.
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
  const lo = low ?? min;
  const hi = high ?? max;
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

  return (
    <div ref={ref} className={cx(styles.root, className)} data-size={size}>
      {hasLabel || (showValue && valueText != null) ? (
        <div className={styles.labelRow}>
          {hasLabel ? (
            <span id={labelId} className={styles.label}>
              {label}
            </span>
          ) : (
            <span />
          )}
          {showValue && valueText != null ? (
            <span className={styles.value}>{valueText}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={styles.track}
        role="meter"
        data-tone={tone}
        aria-valuenow={value}
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
