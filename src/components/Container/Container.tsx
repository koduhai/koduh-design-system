import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Container.module.css';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Max-width preset off the breakpoint scale. Defaults to 'lg'. */
  size?: ContainerSize;
  /** Horizontal padding. Defaults to true. */
  padded?: boolean;
  /** Render the single child instead of a <div>, merging props. */
  asChild?: boolean;
}

export const Container = /* @__PURE__ */ forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ size = 'lg', padded = true, asChild = false, className, ...props }, ref) {
    const classes = cx(styles.root, className);
    const dataAttrs = { 'data-size': size, 'data-padded': padded ? 'true' : undefined };
    if (asChild) {
      return <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props} />;
    }
    return <div ref={ref} className={classes} {...dataAttrs} {...props} />;
  },
);
