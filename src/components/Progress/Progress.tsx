import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Progress.module.css';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressTone =
  | 'primary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Determinate progress amount. Omit for an indeterminate bar. */
  value?: number;
  /** Upper bound of `value`. Default 100. */
  max?: number;
  /** Accessible name; also shown when `showValue` is set. */
  label?: string;
  /** Render a visible label row with the percentage. Default false. */
  showValue?: boolean;
  /** Track thickness. Default 'md'. */
  size?: ProgressSize;
  /** Fill color. Default 'primary'. */
  tone?: ProgressTone;
}

export const Progress = /* @__PURE__ */ forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value,
    max = 100,
    label,
    showValue = false,
    size = 'md',
    tone = 'primary',
    className,
    ...props
  },
  ref,
) {
  // A non-finite value (NaN/Infinity) is treated as indeterminate so it never
  // leaks an invalid aria-valuenow or width:NaN% into the DOM.
  const indeterminate = value == null || !Number.isFinite(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), Math.max(max, 0));
  const pct = indeterminate || max <= 0 ? 0 : (clamped / max) * 100;
  const labelId = useId('progress-label');
  const showLabelBlock = showValue && label != null;

  return (
    <div ref={ref} className={cx(styles.root, className)} data-size={size} {...props}>
      {showLabelBlock ? (
        <div className={styles.labelRow}>
          <span id={labelId} className={styles.label}>
            {label}
          </span>
          {!indeterminate ? <span className={styles.value}>{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div
        className={styles.track}
        data-tone={tone}
        data-indeterminate={indeterminate ? 'true' : undefined}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={indeterminate ? undefined : `${Math.round(pct)}%`}
        aria-label={showLabelBlock ? undefined : label}
        aria-labelledby={showLabelBlock ? labelId : undefined}
      >
        <div
          className={styles.bar}
          style={indeterminate ? undefined : ({ width: `${pct}%` } as CSSProperties)}
        />
      </div>
    </div>
  );
});
