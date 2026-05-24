import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Stat.module.css';

export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The metric name. */
  label: ReactNode;
  /** The metric value; rendered with tabular numerals. */
  value: ReactNode;
  /** Change indicator text, e.g. "12%". */
  delta?: ReactNode;
  /** Drives the delta colour and direction arrow. Defaults to 'neutral'. */
  trend?: StatTrend;
  /** Optional accent icon shown beside the label. */
  icon?: ReactNode;
  /** Sub-label rendered alongside the delta. */
  helpText?: ReactNode;
}

const TREND_GLYPH: Record<StatTrend, string> = { up: '↑', down: '↓', neutral: '→' };
const TREND_WORD: Record<StatTrend, string> = {
  up: 'Increased',
  down: 'Decreased',
  neutral: 'No change',
};

export const Stat = /* @__PURE__ */ forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, delta, trend = 'neutral', icon, helpText, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cx(styles.root, className)} data-trend={trend} {...props}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon ? (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <div className={styles.value}>{value}</div>
      {delta != null || helpText != null ? (
        <div className={styles.footer}>
          {delta != null ? (
            <span className={styles.delta}>
              <span className={styles.arrow} aria-hidden>
                {TREND_GLYPH[trend]}
              </span>
              <VisuallyHidden>{TREND_WORD[trend]}: </VisuallyHidden>
              {delta}
            </span>
          ) : null}
          {helpText != null ? <span className={styles.help}>{helpText}</span> : null}
        </div>
      ) : null}
    </div>
  );
});
