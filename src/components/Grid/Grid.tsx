import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Grid.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed track count: repeat(columns, 1fr). Wins over minItemWidth. */
  columns?: number;
  /** Auto-fit tracks: repeat(auto-fit, minmax(minItemWidth, 1fr)). */
  minItemWidth?: string;
  /** Space between cells. Defaults to 4. */
  gap?: SpaceToken;
  asChild?: boolean;
}

export const Grid = /* @__PURE__ */ forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, minItemWidth, gap = 4, asChild = false, className, style, ...props },
  ref,
) {
  const template =
    columns != null
      ? `repeat(${columns}, minmax(0, 1fr))`
      : minItemWidth != null
        ? `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
        : undefined;
  const classes = cx(styles.root, className);
  const mergedStyle = {
    ...(template ? { ['--grid-template']: template } : {}),
    ['--grid-gap']: `var(--ku-space-${gap})`,
    ...style,
  } as CSSProperties;
  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} style={mergedStyle} {...props} />
    );
  }
  return <div ref={ref} className={classes} style={mergedStyle} {...props} />;
});
