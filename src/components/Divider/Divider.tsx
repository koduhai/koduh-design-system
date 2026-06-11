import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Divider.module.css';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Defaults to 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
  /** Optional centered label (horizontal only). When present, the divider is decorative (role="presentation"). */
  children?: ReactNode;
  /** Indent the rule from the start edge (useful inside lists/menus). */
  inset?: boolean;
}

export const Divider = /* @__PURE__ */ forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', inset = false, className, children, ...props },
  ref,
) {
  // An empty or whitespace-only string is a common product of conditional
  // rendering (e.g. `<Divider>{show ? 'OR' : ''}</Divider>`); treat it as "no
  // label" so the divider keeps its real role="separator" semantics instead of
  // rendering an empty label and falling back to role="presentation".
  const hasLabel =
    children != null &&
    children !== false &&
    !(typeof children === 'string' && children.trim() === '');

  const dataAttrs = {
    'data-orientation': orientation,
    'data-inset': inset ? 'true' : undefined,
  };

  // Labelled divider is decorative: the label conveys meaning, so the element
  // itself is presentational and the two rules are aria-hidden.
  if (hasLabel) {
    return (
      <div
        ref={ref}
        role="presentation"
        className={cx(styles.root, styles.labelled, className)}
        data-orientation="horizontal"
        data-inset={inset ? 'true' : undefined}
        {...props}
      >
        <span className={styles.rule} aria-hidden="true" />
        <span className={styles.label}>{children}</span>
        <span className={styles.rule} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cx(styles.root, className)}
      {...dataAttrs}
      {...props}
    />
  );
});
