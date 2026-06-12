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

const CardRoot = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps>(function Card(
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

/** Shared props for the Card slot subcomponents. */
export interface CardSlotProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a <div>, merging slot props onto it. */
  asChild?: boolean;
}
export type CardHeaderProps = CardSlotProps;
export type CardBodyProps = CardSlotProps;
export type CardFooterProps = CardSlotProps;

/**
 * Build a Card slot subcomponent that follows Card's conventions:
 * forwardRef to a <div>, `cx`-merged className, asChild via Slot, DOM-prop spread.
 */
function createCardSlot(displayName: string, slotClass: string | undefined) {
  const Slot_ = /* @__PURE__ */ forwardRef<HTMLDivElement, CardSlotProps>(function CardSlot(
    { asChild = false, className, children, ...props },
    ref,
  ) {
    const classes = cx(slotClass, className);
    if (asChild) {
      return (
        <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  });
  Slot_.displayName = displayName;
  return Slot_;
}

/** Bordered header region for a Card. Pairs with `<Card padding="none">`. */
export const CardHeader = /* @__PURE__ */ createCardSlot('CardHeader', styles.header);
/** Padded content region for a Card. Pairs with `<Card padding="none">`. */
export const CardBody = /* @__PURE__ */ createCardSlot('CardBody', styles.body);
/** Top-bordered footer region for a Card. Pairs with `<Card padding="none">`. */
export const CardFooter = /* @__PURE__ */ createCardSlot('CardFooter', styles.footer);

/**
 * Card with compound slot subcomponents attached.
 *
 * Recommended composition: use `<Card padding="none">` and let the slots own
 * their padding, e.g.
 * ```tsx
 * <Card padding="none">
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 *   <Card.Footer>Actions</Card.Footer>
 * </Card>
 * ```
 * Plain `<Card>padded content</Card>` continues to work unchanged.
 */
type CardComponent = typeof CardRoot & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

export const Card = CardRoot as CardComponent;
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
