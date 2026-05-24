import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Stack.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Space between children, from the --ku-space scale. Defaults to 4. */
  gap?: SpaceToken;
  /** align-items. */
  align?: StackAlign;
  /** justify-content. */
  justify?: StackJustify;
  /** Allow children to wrap. */
  wrap?: boolean;
  /** Render the single child instead of a <div>, merging props. */
  asChild?: boolean;
}

export const Stack = /* @__PURE__ */ forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = 4, align, justify, wrap, asChild = false, className, style, ...props },
  ref,
) {
  const classes = cx(styles.root, className);
  const mergedStyle = { ['--stack-gap']: `var(--ku-space-${gap})`, ...style } as CSSProperties;
  const dataAttrs = {
    'data-align': align,
    'data-justify': justify,
    'data-wrap': wrap ? '' : undefined,
  };
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
});
