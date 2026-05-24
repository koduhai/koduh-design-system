import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextTone = 'default' | 'secondary';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: TextSize;
  weight?: TextWeight;
  /** 'default' → primary text color; 'secondary' → secondary. */
  tone?: TextTone;
  /** Element to render. Ignored when asChild. Defaults to 'span'. */
  as?: ElementType;
  asChild?: boolean;
}

export const Text = /* @__PURE__ */ forwardRef<HTMLElement, TextProps>(function Text(
  { size = 'md', weight, tone = 'default', as, asChild = false, className, ...props },
  ref,
) {
  const classes = cx(styles.root, className);
  const dataAttrs = {
    'data-size': size,
    'data-weight': weight,
    'data-tone': tone === 'secondary' ? 'secondary' : undefined,
  };
  if (asChild) {
    return <Slot ref={ref} className={classes} {...dataAttrs} {...props} />;
  }
  const Comp = (as ?? 'span') as ElementType;
  return <Comp ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props} />;
});
