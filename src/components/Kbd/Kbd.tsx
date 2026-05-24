import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Kbd.module.css';

export type KbdSize = 'sm' | 'md';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** The key label(s) to display. */
  children: ReactNode;
  /** Defaults to 'md'. */
  size?: KbdSize;
}

export const Kbd = /* @__PURE__ */ forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = 'md', className, children, ...props },
  ref,
) {
  return (
    <kbd ref={ref} className={cx(styles.root, className)} data-size={size} {...props}>
      {children}
    </kbd>
  );
});
