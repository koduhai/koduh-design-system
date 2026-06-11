import { forwardRef } from 'react';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';
import { VisuallyHidden } from '../../primitives';
import styles from './LoadingButton.module.css';

// asChild is intentionally unsupported on LoadingButton. The loading spinner is
// injected via startIcon and the loading guard relies on the native `disabled`
// attribute, neither of which survives Button's Slot/asChild path (startIcon is
// dropped, and `disabled` does not block interaction on a non-button child). So
// the prop is removed from the public type and stripped at runtime to keep the
// loading contract sound.
export interface LoadingButtonProps extends Omit<ButtonProps, 'asChild'> {
  /** Show a spinner, set aria-busy, and disable interaction. */
  loading?: boolean;
  /** Screen-reader-only text announced while loading (e.g. "Saving…"). */
  loadingText?: string;
}

export const LoadingButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading = false, loadingText, disabled, startIcon, children, ...props },
    ref,
  ) {
    // Defensively drop asChild for JS-only consumers who bypass the type.
    delete (props as { asChild?: boolean }).asChild;
    return (
      <Button
        ref={ref}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        startIcon={loading ? <span className={styles.spinner} aria-hidden /> : startIcon}
        {...props}
      >
        {children}
        {loading && loadingText ? <VisuallyHidden>{loadingText}</VisuallyHidden> : null}
      </Button>
    );
  },
);
