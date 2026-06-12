import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './StatusBadge.module.css';

export type StatusBadgeStatus = 'active' | 'inactive' | 'pending' | 'error';
export type StatusBadgeVariant = 'solid' | 'subtle';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic status. Drives color and the dot. */
  status: StatusBadgeStatus;
  /** Text label — always rendered so color is never the only signal. */
  label: string;
  /** Visual style. Defaults to 'subtle'. */
  variant?: StatusBadgeVariant;
}

export const StatusBadge = /* @__PURE__ */ forwardRef<HTMLSpanElement, StatusBadgeProps>(
  function StatusBadge({ status, label, variant = 'subtle', className, ...props }, ref) {
    const dataAttrs = {
      'data-status': status,
      'data-variant': variant,
    };
    const classes = cx(styles.root, className);

    return (
      <span ref={ref} className={classes} {...dataAttrs} {...props}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.label}>{label}</span>
      </span>
    );
  },
);
