import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import { mergeRefs } from '../../primitives';
import { useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import styles from './Snackbar.module.css';

export type SnackbarSeverity = 'info' | 'success' | 'warning' | 'error';
export type SnackbarPlacement = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center';

export interface SnackbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Controls visibility. */
  open: boolean;
  /**
   * Called with `false` when the snackbar requests to close (close button,
   * auto-hide, or Esc). Named to match Popover/Dialog for a consistent API.
   */
  onOpenChange: (open: boolean) => void;
  /** Semantic severity. Drives color, icon, and ARIA role. Defaults to 'info'. */
  severity?: SnackbarSeverity;
  /** The message content. */
  children: ReactNode;
  /** Optional action element, e.g. an "Undo" button. */
  action?: ReactNode;
  /** Auto-dismiss after N ms. 0/undefined disables auto-hide. */
  autoHideDuration?: number;
  /** Fixed-position placement. Defaults to 'bottom-center'. */
  placement?: SnackbarPlacement;
}

const severityIcons: Record<SnackbarSeverity, ReactNode> = {
  info: <InfoIcon size={20} />,
  success: <CheckIcon size={20} />,
  warning: <WarningIcon size={20} />,
  error: <ErrorIcon size={20} />,
};

export const Snackbar = /* @__PURE__ */ forwardRef<HTMLDivElement, SnackbarProps>(function Snackbar(
  {
    open,
    onOpenChange,
    severity = 'info',
    children,
    action,
    autoHideDuration,
    placement = 'bottom-center',
    className,
    onKeyDown,
    ...props
  },
  ref,
) {
  const messages = useMessages();
  const innerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest onOpenChange in a ref so the auto-hide timer doesn't restart
  // on every parent re-render. onOpenChange is almost always an inline arrow, so
  // making the timer effect depend on it would clear+restart the timeout each
  // render — and if the parent re-renders within each autoHideDuration window,
  // the snackbar would never auto-dismiss.
  const onCloseRef = useRef(onOpenChange);
  useEffect(() => {
    onCloseRef.current = onOpenChange;
  }, [onOpenChange]);

  // Sync `open` to the native Popover API (top-layer). The `popover` attribute
  // is applied imperatively only where the API is supported, so that in
  // environments without it (e.g. jsdom) the node renders as a plain,
  // accessible element via the `data-open` styling fallback — degrading
  // gracefully and never throwing.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (typeof el.showPopover !== 'function') return;
    el.setAttribute('popover', 'manual');
    if (open) {
      try {
        el.showPopover();
      } catch {
        // Already shown; ignore.
      }
    } else {
      try {
        el.hidePopover();
      } catch {
        // Already hidden; ignore.
      }
    }
    // Degradation guard: if the platform exposes the API but it does not
    // actually promote the element to the top layer (e.g. jsdom's no-op stub),
    // the `popover` attribute would only hide the content. Drop it so the node
    // stays in the accessibility tree; `data-open` then drives styling.
    let opened: boolean;
    try {
      opened = el.matches(':popover-open');
    } catch {
      opened = false;
    }
    if (open && !opened) el.removeAttribute('popover');
  }, [open]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (open && autoHideDuration && autoHideDuration > 0) {
      timerRef.current = setTimeout(() => {
        onCloseRef.current(false);
      }, autoHideDuration);
    }
  }, [open, autoHideDuration, clearTimer]);

  // Auto-hide: start the timer when open with a positive duration; clear on
  // close/unmount.
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  // Escape dismisses the snackbar when focus is within it.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.key === 'Escape') {
        onCloseRef.current(false);
      }
    },
    [onKeyDown],
  );

  return (
    // Persistent live region. It is NOT the popover element, so it always stays
    // in the accessibility tree (an open popover removes its closed self from the
    // tree). Keeping it present means the message inserted on open is announced,
    // rather than relying on a region appearing from display:none. While closed
    // the region is empty and the visual card below is not rendered.
    <div
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      className={styles.region}
      onKeyDown={handleKeyDown}
    >
      {open ? (
        <div
          ref={mergeRefs(innerRef, ref)}
          data-severity={severity}
          data-placement={placement}
          data-open="true"
          className={cx(styles.root, className)}
          onMouseEnter={clearTimer}
          onMouseLeave={startTimer}
          onFocus={clearTimer}
          onBlur={startTimer}
          {...props}
        >
          <span className={styles.icon} aria-hidden>
            {severityIcons[severity]}
          </span>
          <div className={styles.message}>{children}</div>
          {action ? <div className={styles.action}>{action}</div> : null}
          <button
            type="button"
            className={styles.close}
            aria-label={messages.close}
            onClick={() => onOpenChange(false)}
          >
            <CloseIcon size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
});
