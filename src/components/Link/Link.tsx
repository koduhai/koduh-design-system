import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Link.module.css';

export type LinkTone = 'primary' | 'neutral';
export type LinkUnderline = 'always' | 'hover' | 'none';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Semantic color. Defaults to 'primary'. */
  tone?: LinkTone;
  /**
   * When the underline shows. Defaults to 'always' so links embedded in body
   * text stay distinguishable without relying on color (WCAG 1.4.1 /
   * link-in-text-block). Use 'hover'/'none' for standalone links (nav, lists)
   * where surrounding prose isn't present.
   */
  underline?: LinkUnderline;
  /** Render the consumer element (e.g. a router <Link>), merging props. */
  asChild?: boolean;
}

export const Link = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { tone = 'primary', underline = 'always', asChild = false, className, ...props },
  ref,
) {
  const classes = cx(styles.root, className);
  const dataAttrs = { 'data-tone': tone, 'data-underline': underline };
  if (asChild) {
    return <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props} />;
  }
  return <a ref={ref} className={classes} {...dataAttrs} {...props} />;
});
