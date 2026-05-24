import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import { mergeRefs, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { CloseIcon } from '../../icons';
import styles from './Drawer.module.css';

export type DrawerSide = 'start' | 'end' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  /** Whether the drawer is shown modally. */
  open: boolean;
  /** Called with the requested next open state (the drawer only requests `false`). */
  onOpenChange: (open: boolean) => void;
  /** Heading rendered in the header and used as the accessible name. */
  title?: ReactNode;
  /**
   * Edge the panel is pinned to. Logical, so 'start'/'end' flip in `dir="rtl"`.
   * Defaults to 'end'.
   */
  side?: DrawerSide;
  /** Panel width (inline sides) or height (block sides). Defaults to 'md'. */
  size?: DrawerSize;
  /** Allow Esc and backdrop click to close. Default true. */
  dismissable?: boolean;
  /** Where to send focus when the drawer opens, overriding the native default. */
  initialFocus?: RefObject<HTMLElement | null> | string;
  /** Actions rendered in the footer. */
  footer?: ReactNode;
  children?: ReactNode;
}

export const Drawer = /* @__PURE__ */ forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(
  {
    open,
    onOpenChange,
    title,
    side = 'end',
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
  const titleId = useId('drawer-title');
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Sync React `open` to native showModal()/close(), guarding both directions.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
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

  // Native close/cancel (Esc) → onOpenChange.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => close();
    const handleCancel = (event: Event) => {
      if (!dismissable) {
        event.preventDefault();
        return;
      }
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
      data-side={side}
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
