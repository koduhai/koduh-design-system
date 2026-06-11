import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { ChipTone } from '../Chip';
import { VisuallyHidden } from '../../primitives/VisuallyHidden';
import { cx } from '../../utils/cx';
import styles from './NotificationBadge.module.css';

export type NotificationBadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

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
  // Normalize to a non-negative integer so a stray negative or fractional
  // count never renders as e.g. "-1" or "3.5". A non-finite count (NaN) and
  // a count <= 0 both collapse to the zero case.
  const n = count === undefined ? undefined : Math.max(0, Math.floor(count));
  const safeCount = n === undefined || !Number.isFinite(n) ? 0 : n;
  const hidden = !dot && (count === undefined || (safeCount === 0 && !showZero));
  const display = dot ? '' : safeCount > max ? `${max}+` : String(safeCount);
  const standalone = children === undefined;
  // When no explicit label is given, announce the count with a unit so AT
  // never hears a bare, context-free integer. The visual number stays
  // aria-hidden and the synthesized text is exposed via VisuallyHidden.
  const accessibleLabel = label ?? (dot ? undefined : `${display} notifications`);

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
          // A dot conveys meaning by shape/color alone, so a label-less dot is
          // decorative: hide it from AT rather than expose an ambiguous bare
          // element. A count always carries an accessibleLabel, so it stays
          // announced.
          aria-hidden={dot && !label ? true : undefined}
        >
          {!dot && <span aria-hidden>{display}</span>}
          {accessibleLabel && <VisuallyHidden>{accessibleLabel}</VisuallyHidden>}
        </span>
      )}
    </span>
  );
});
