import { forwardRef } from 'react';
import type { CSSProperties, ElementType, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextTone = 'default' | 'secondary';
export type TextLeading = 'tight' | 'normal' | 'relaxed';
export type TextFamily = 'base' | 'mono';
export type TextNumeric = 'normal' | 'tabular';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: TextSize;
  weight?: TextWeight;
  /** 'default' → primary text color; 'secondary' → secondary. */
  tone?: TextTone;
  /** Line height: 'tight' | 'normal' | 'relaxed'. */
  leading?: TextLeading;
  /** Font family: 'base' (default) | 'mono'. */
  family?: TextFamily;
  /** 'tabular' enables tabular-nums for aligned figures. */
  numeric?: TextNumeric;
  /** Text casing transform. 'none' (default) emits no attribute. */
  transform?: TextTransform;
  /** Single-line truncation with an ellipsis. Wins over `lineClamp` when both are set. */
  truncate?: boolean;
  /** Clamp to N lines with an ellipsis. Ignored when `truncate` is set. */
  lineClamp?: number;
  /** Element to render. Ignored when asChild. Defaults to 'span'. */
  as?: ElementType;
  asChild?: boolean;
}

export const Text = /* @__PURE__ */ forwardRef<HTMLElement, TextProps>(function Text(
  {
    size = 'md',
    weight,
    tone = 'default',
    leading,
    family,
    numeric,
    transform,
    truncate,
    lineClamp,
    as,
    asChild = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const classes = cx(styles.root, className);
  // truncate wins over lineClamp when both are set.
  const clamp = !truncate && lineClamp != null;
  const dataAttrs = {
    'data-size': size,
    'data-weight': weight,
    'data-tone': tone === 'secondary' ? 'secondary' : undefined,
    'data-leading': leading,
    'data-family': family === 'mono' ? 'mono' : undefined,
    'data-numeric': numeric === 'tabular' ? 'tabular' : undefined,
    'data-transform': transform && transform !== 'none' ? transform : undefined,
    'data-truncate': truncate ? '' : undefined,
    'data-line-clamp': clamp ? '' : undefined,
  };
  const mergedStyle = clamp
    ? ({ '--text-line-clamp': String(lineClamp), ...style } as CSSProperties)
    : style;
  if (asChild) {
    return <Slot ref={ref} className={classes} style={mergedStyle} {...dataAttrs} {...props} />;
  }
  const Comp = (as ?? 'span') as ElementType;
  return (
    <Comp
      ref={ref as Ref<HTMLElement>}
      className={classes}
      style={mergedStyle}
      {...dataAttrs}
      {...props}
    />
  );
});
