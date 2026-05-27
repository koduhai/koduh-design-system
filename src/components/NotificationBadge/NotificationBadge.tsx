import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { ChipTone } from '../Chip';
import { VisuallyHidden } from '../../primitives/VisuallyHidden';
import { cx } from '../../utils/cx';
import styles from './NotificationBadge.module.css';

export type NotificationBadgePlacement =
  | 'top-end'
  | 'top-start'
  | 'bottom-end'
  | 'bottom-start';

export interface NotificationBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The anchored element (icon/avatar/button). Omit for a standalone badge. */
  children?: ReactNode;
  /** Numeric badge value. */
  count?: number;
  /** Cap before rendering `${max}+`. Defaults to 99. */
  max?: number;
  /** Show a dot instead of a count. */
  dot?: boolean;
  /** Keep the badge visible when count===0. Defaults to false. */
  showZero?: boolean;
  /** Semantic color, reusing the shared tone vocabulary. Defaults to 'danger'. */
  tone?: ChipTone;
  /** Where the badge sits relative to the child. Defaults to 'top-end'. */
  placement?: NotificationBadgePlacement;
  /** Accessible text, e.g. "3 unread notifications". */
  label?: string;
}

export const NotificationBadge = /* @__PURE__ */ forwardRef<
  HTMLSpanElement,
  NotificationBadgeProps
>(function NotificationBadge(
  {
    children,
    count,
    max = 99,
    dot = false,
    showZero = false,
    tone = 'danger',
    placement = 'top-end',
    label,
    className,
    ...props
  },
  ref,
) {
  const hidden = !dot && (count === undefined || (count === 0 && !showZero));
  const display = dot ? '' : count! > max ? `${max}+` : String(count);
  const standalone = children === undefined;

  return (
    <span
      ref={ref}
      className={cx(styles.root, className)}
      data-standalone={standalone || undefined}
      {...props}
    >
      {children}
      {!hidden && (
        <span
          data-badge=""
          data-tone={tone}
          data-dot={dot || undefined}
          data-placement={placement}
          className={styles.badge}
        >
          {!dot && <span aria-hidden={label ? true : undefined}>{display}</span>}
          {label && <VisuallyHidden>{label}</VisuallyHidden>}
        </span>
      )}
    </span>
  );
});
