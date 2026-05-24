import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ScrollArea.module.css';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Content that may overflow the area. */
  children: ReactNode;
  /** Caps the area height; a number is treated as px. */
  maxHeight?: number | string;
  /** Scroll axis the area allows. Defaults to 'vertical'. */
  orientation?: ScrollAreaOrientation;
}

export const ScrollArea = /* @__PURE__ */ forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    { children, maxHeight, orientation = 'vertical', className, style, tabIndex, ...props },
    ref,
  ) {
    const sizeStyle: CSSProperties =
      maxHeight != null
        ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
        : {};

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        data-orientation={orientation}
        // tabIndex=0 makes the region keyboard-scrollable (arrows/PageUp/Down)
        // even with no focusable children; browsers ignore it when it doesn't overflow.
        tabIndex={tabIndex ?? 0}
        style={{ ...sizeStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
