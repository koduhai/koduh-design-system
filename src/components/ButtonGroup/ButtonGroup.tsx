import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ButtonGroup.module.css';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout direction. Defaults to 'horizontal'. */
  orientation?: ButtonGroupOrientation;
  /**
   * Expects Button elements; they are joined into a segmented cluster.
   *
   * The root renders with `role="group"`, which only conveys useful grouping
   * semantics to assistive tech when it has an accessible name. Pass an
   * `aria-label` (or `aria-labelledby`) describing the cluster, e.g.
   * `<ButtonGroup aria-label="Text style">`. Both forward to the root via the
   * spread DOM props.
   */
  children: ReactNode;
}

/**
 * Purely presentational cluster that joins adjacent Buttons by collapsing the
 * inner radii/borders. It does not inject props into its children — tone, size,
 * and variant are set on each Button directly.
 */
export const ButtonGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup({ orientation = 'horizontal', className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="group"
        className={cx(styles.root, className)}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    );
  },
);
