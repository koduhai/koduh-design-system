import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import { mergeRefs, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { CloseIcon } from '../../icons';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  /** Whether the dialog is shown modally. */
  open: boolean;
  /**
   * Called with the requested next open state. The dialog only ever requests to
   * close (close button, Esc, backdrop), so this fires with `false`. Named to
   * match Popover/Select for a consistent overlay API.
   */
  onOpenChange: (open: boolean) => void;
  /** Heading rendered in the dialog header and used as its accessible name. */
  title?: ReactNode;
  /** Max-width preset. Defaults to 'md'. */
  size?: DialogSize;
  /** Allow Esc and backdrop click to close. Default true. */
  dismissable?: boolean;
  /**
   * Where to send focus when the dialog opens, overriding the native default
   * (the first focusable descendant — usually the Close button). A ref to an
   * element, or a CSS selector queried within the dialog.
   */
  initialFocus?: RefObject<HTMLElement | null> | string;
  /** Actions rendered in the dialog footer. */
  footer?: ReactNode;
  children?: ReactNode;
}

export const Dialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    open,
    onOpenChange,
    title,
    size = 'md',
    dismissable = true,
    initialFocus,
    footer,
    children,
    className,
    ...props
  },
  forwardedRef,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Tracks whether the press that may become a backdrop click actually started
  // on the backdrop. A drag that begins inside .surface (e.g. selecting text in
  // a form field) and releases over the backdrop is reported by the browser as a
  // click on the dialog element; without this guard it would dismiss and discard
  // the user's input.
  const pressedBackdrop = useRef(false);
  const titleId = useId('dialog-title');
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Sync the React `open` prop to native showModal()/close(), guarding both
  // directions so we never hit InvalidStateError ("already open").
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Override the native default focus target (the Close button) when the
      // consumer points us at a specific element (e.g. the first form field).
      if (initialFocus) {
        const target =
          typeof initialFocus === 'string'
            ? dialog.querySelector<HTMLElement>(initialFocus)
            : initialFocus.current;
        target?.focus();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // Keyed on `open`; `initialFocus` is read via closure (no exhaustive-deps rule).
  }, [open]);

  // Wire native close/cancel (browser fires these on Esc) to onClose.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => close();
    const handleCancel = (event: Event) => {
      if (!dismissable) {
        event.preventDefault();
        return;
      }
      // Native cancel is followed by close, which already calls onOpenChange.
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [close, dismissable]);

  const handleBackdropMouseDown = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    // Only the dialog element itself is the backdrop; anything inside .surface
    // bubbles up with a deeper target.
    pressedBackdrop.current = event.target === dialogRef.current;
  }, []);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      const releasedOnBackdrop = event.target === dialogRef.current;
      const startedOnBackdrop = pressedBackdrop.current;
      pressedBackdrop.current = false;
      // Close only when both the press and the release landed on the backdrop,
      // so a press-inside / release-on-backdrop drag does not dismiss.
      if (dismissable && startedOnBackdrop && releasedOnBackdrop) {
        close();
      }
    },
    [dismissable, close],
  );

  return (
    <dialog
      ref={mergeRefs(dialogRef, forwardedRef)}
      className={cx(styles.root, className)}
      data-size={size}
      aria-labelledby={title ? titleId : undefined}
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      {...props}
    >
      <div className={styles.surface}>
        {(title || dismissable) && (
          <div className={styles.header}>
            {title ? (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            {dismissable ? (
              <button type="button" className={styles.close} aria-label="Close" onClick={close}>
                <CloseIcon aria-hidden />
              </button>
            ) : null}
          </div>
        )}
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </dialog>
  );
});
