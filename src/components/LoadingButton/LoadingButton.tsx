import { forwardRef } from 'react';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';
import { VisuallyHidden } from '../../primitives';
import styles from './LoadingButton.module.css';

export interface LoadingButtonProps extends ButtonProps {
  /** Show a spinner, set aria-busy, and disable interaction. */
  loading?: boolean;
  /** Screen-reader-only text announced while loading (e.g. "Saving…"). */
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading = false, loadingText, disabled, startIcon, children, ...props },
    ref,
  ) {
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
