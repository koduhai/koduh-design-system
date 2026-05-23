import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Card.module.css';

export type CardVariant = 'outline' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Surface style. Defaults to 'outline'. */
  variant?: CardVariant;
  /** Inner padding scale. Defaults to 'md'. */
  padding?: CardPadding;
  /** Render the single child element instead of a <div>, merging Card props onto it. */
  asChild?: boolean;
}

export const Card = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'outline', padding = 'md', asChild = false, className, children, ...props },
  ref,
) {
  const dataAttrs = {
    'data-variant': variant,
    'data-padding': padding,
  };
  const classes = cx(styles.root, className);

  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <div ref={ref} className={classes} {...dataAttrs} {...props}>
      {children}
    </div>
  );
});
