import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import { mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Snackbar.module.css';

export type SnackbarSeverity = 'info' | 'success' | 'warning' | 'error';
export type SnackbarPlacement = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center';

export interface SnackbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Controls visibility. */
  open: boolean;
  /** Called when the snackbar requests to close (close button or auto-hide). */
  onClose: () => void;
  /** Semantic severity. Drives color, icon, and ARIA role. Defaults to 'info'. */
  severity?: SnackbarSeverity;
  /** The message content. */
  message: ReactNode;
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
    onClose,
    severity = 'info',
    message,
    action,
    autoHideDuration,
    placement = 'bottom-center',
    className,
    ...props
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        onClose();
      }, autoHideDuration);
    }
  }, [open, autoHideDuration, onClose, clearTimer]);

  // Auto-hide: start the timer when open with a positive duration; clear on
  // close/unmount.
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  return (
    <div
      ref={mergeRefs(innerRef, ref)}
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      data-severity={severity}
      data-placement={placement}
      data-open={open ? 'true' : undefined}
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
      <div className={styles.message}>{message}</div>
      {action ? <div className={styles.action}>{action}</div> : null}
      <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
        <CloseIcon size={18} />
      </button>
    </div>
  );
});
