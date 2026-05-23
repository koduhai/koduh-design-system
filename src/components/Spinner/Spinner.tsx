import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerTone = 'primary' | 'neutral';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role'> {
  /** Defaults to 'md'. */
  size?: SpinnerSize;
  /** Semantic color. Defaults to 'primary'. */
  tone?: SpinnerTone;
  /**
   * Accessible label. When provided, the root is `role="status"` with visually-hidden
   * text so screen readers announce it. When omitted, the spinner is decorative
   * (`aria-hidden`).
   */
  label?: string;
}

export const Spinner = /* @__PURE__ */ forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', tone = 'primary', label, className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(styles.root, className)}
      data-size={size}
      data-tone={tone}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : 'true'}
      {...props}
    >
      <span className={styles.circle} aria-hidden="true" />
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
});
