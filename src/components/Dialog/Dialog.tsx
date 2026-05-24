import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
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
    footer,
    children,
    className,
    ...props
  },
  forwardedRef,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId('dialog-title');
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Sync the React `open` prop to native showModal()/close(), guarding both
  // directions so we never hit InvalidStateError ("already open").
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
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

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (dismissable && event.target === dialogRef.current) {
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
