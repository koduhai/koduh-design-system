import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Shape of the placeholder. Defaults to 'text'. */
  variant?: SkeletonVariant;
  /** Width. Numbers are treated as px; strings are used verbatim. */
  width?: number | string;
  /** Height. Numbers are treated as px; strings are used verbatim. */
  height?: number | string;
  /** Animation style. Defaults to 'pulse'. */
  animation?: 'pulse' | 'none';
}

function toCssSize(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export const Skeleton = /* @__PURE__ */ forwardRef<HTMLSpanElement, SkeletonProps>(
  function Skeleton(
    { variant = 'text', width, height, animation = 'pulse', className, style, ...props },
    ref,
  ) {
    const mergedStyle: CSSProperties = {
      width: toCssSize(width),
      height: toCssSize(height),
      ...style,
    };

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx(styles.root, className)}
        data-variant={variant}
        data-animation={animation}
        style={mergedStyle}
        {...props}
      />
    );
  },
);
