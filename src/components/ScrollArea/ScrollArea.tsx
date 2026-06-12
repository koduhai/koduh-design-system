import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { mergeRefs } from '../../primitives';
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

function measureOverflow(el: HTMLDivElement, orientation: ScrollAreaOrientation): boolean {
  // A 1px slack absorbs sub-pixel rounding so a non-scrolling area is not
  // reported as overflowing.
  const overflowsY = el.scrollHeight - el.clientHeight > 1;
  const overflowsX = el.scrollWidth - el.clientWidth > 1;
  if (orientation === 'horizontal') return overflowsX;
  if (orientation === 'both') return overflowsX || overflowsY;
  return overflowsY;
}

export const ScrollArea = /* @__PURE__ */ forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    { children, maxHeight, orientation = 'vertical', className, style, tabIndex, ...props },
    ref,
  ) {
    const innerRef = useRef<HTMLDivElement>(null);
    const [overflows, setOverflows] = useState(false);

    const sizeStyle: CSSProperties =
      maxHeight != null
        ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
        : {};

    // Only a region that actually scrolls should be a keyboard tab stop. APG
    // recommends making a scroll container focusable WHEN it overflows; a div
    // with tabindex="0" is otherwise an empty focus trap announced as a region
    // that does nothing. Re-measure on content/size changes via ResizeObserver.
    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const update = () => setOverflows(measureOverflow(el, orientation));
      update();
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [orientation, maxHeight]);

    // A consumer-supplied tabIndex always wins; otherwise gate focusability on
    // measured overflow so a fitting area is not a no-op tab stop.
    const resolvedTabIndex = tabIndex ?? (overflows ? 0 : undefined);

    return (
      <div
        ref={mergeRefs(innerRef, ref)}
        className={cx(styles.root, className)}
        data-orientation={orientation}
        tabIndex={resolvedTabIndex}
        style={{ ...sizeStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
