import { forwardRef } from 'react';
import type { CSSProperties, ElementType, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Box.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  padding?: SpaceToken;
  px?: SpaceToken;
  py?: SpaceToken;
  grow?: boolean;
  shrink?: boolean;
  minWidth?: 0 | string;
  width?: string;
  as?: ElementType;
  asChild?: boolean;
}

export const Box = /* @__PURE__ */ forwardRef<HTMLDivElement, BoxProps>(function Box(
  {
    padding,
    px,
    py,
    grow,
    shrink,
    minWidth,
    width,
    as,
    asChild = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const vars: Record<string, string> = {};
  if (padding != null) vars['--box-p'] = `var(--ku-space-${padding})`;
  if (px != null) vars['--box-px'] = `var(--ku-space-${px})`;
  if (py != null) vars['--box-py'] = `var(--ku-space-${py})`;
  if (minWidth != null) vars['--box-min-width'] = String(minWidth);
  if (width != null) vars['--box-width'] = width;
  const mergedStyle = { ...vars, ...style } as CSSProperties;
  const dataAttrs = {
    'data-grow': grow ? '' : undefined,
    'data-shrink': shrink == null ? undefined : shrink ? 'true' : 'false',
  };
  const classes = cx(styles.root, className);
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
  const Comp = (as ?? 'div') as ElementType;
  return <Comp ref={ref} className={classes} style={mergedStyle} {...dataAttrs} {...props} />;
});
