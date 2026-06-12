import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Container.module.css';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Max-width preset off the breakpoint scale. Defaults to 'lg'. */
  size?: ContainerSize;
  /** Horizontal padding. Defaults to true. */
  padded?: boolean;
  /** Vertical padding (space token). Omitted by default (no vertical padding). */
  py?: SpaceToken;
  /** Render the single child instead of a <div>, merging props. */
  asChild?: boolean;
}

export const Container = /* @__PURE__ */ forwardRef<HTMLDivElement, ContainerProps>(
  function Container(
    { size = 'lg', padded = true, py, asChild = false, className, style, ...props },
    ref,
  ) {
    const classes = cx(styles.root, className);
    const dataAttrs = { 'data-size': size, 'data-padded': padded ? 'true' : undefined };
    const mergedStyle = {
      ...(py != null ? { ['--container-py']: `var(--ku-space-${py})` } : {}),
      ...style,
    } as CSSProperties;
    if (asChild) {
      return (
        <Slot
          ref={ref as Ref<HTMLElement>}
          className={classes}
          style={mergedStyle}
          {...dataAttrs}
          {...props}
        />
      );
    }
    return <div ref={ref} className={classes} style={mergedStyle} {...dataAttrs} {...props} />;
  },
);
