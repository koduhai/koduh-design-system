import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Inline.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type InlineAlign = 'start' | 'center' | 'end' | 'stretch';
export type InlineJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  /** Space between children, from the --ku-space scale. Defaults to 4. */
  gap?: SpaceToken;
  /** align-items. */
  align?: InlineAlign;
  /** justify-content. */
  justify?: InlineJustify;
  /** Allow children to wrap. */
  wrap?: boolean;
  /** Render the single child instead of a <div>, merging props. */
  asChild?: boolean;
}

export const Inline = /* @__PURE__ */ forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { gap = 4, align, justify, wrap, asChild = false, className, style, ...props },
  ref,
) {
  const classes = cx(styles.root, className);
  const mergedStyle = { ['--inline-gap']: `var(--ku-space-${gap})`, ...style } as CSSProperties;
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
