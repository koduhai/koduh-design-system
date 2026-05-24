import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to 'solid'. */
  variant?: ButtonVariant;
  /** Semantic color. Defaults to 'primary'. */
  tone?: ButtonTone;
  /** Defaults to 'md'. */
  size?: ButtonSize;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Icon before the label (ignored when asChild). */
  startIcon?: ReactNode;
  /** Icon after the label (ignored when asChild). */
  endIcon?: ReactNode;
  /** Render the single child element instead of a <button>, merging button props onto it. */
  asChild?: boolean;
}

export const Button = /* @__PURE__ */ forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    tone = 'primary',
    size = 'md',
    fullWidth = false,
    startIcon,
    endIcon,
    asChild = false,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const dataAttrs = {
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
    'data-full-width': fullWidth ? 'true' : undefined,
  };
  const classes = cx(styles.root, className);

  if (asChild) {
    // Button's ref is typed for HTMLButtonElement; Slot accepts Ref<HTMLElement>.
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} className={classes} type={type ?? 'button'} {...dataAttrs} {...props}>
      {startIcon ? (
        <span className={styles.icon} aria-hidden>
          {startIcon}
        </span>
      ) : null}
      {children}
      {endIcon ? (
        <span className={styles.icon} aria-hidden>
          {endIcon}
        </span>
      ) : null}
    </button>
  );
});
