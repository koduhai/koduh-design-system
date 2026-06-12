import { useRef } from 'react';
import { Dialog } from './Dialog';
import type { DialogProps } from './Dialog';
import { Button } from '../Button';
import { LoadingButton } from '../LoadingButton';
import { useId } from '../../primitives';
import type { ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  /** Controls whether the dialog is visible. */
  open: boolean;
  /** Called with `false` when the dialog requests to close (cancel, Esc, backdrop). */
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user presses confirm. In the default (fire-and-forget) mode,
   * `onOpenChange(false)` is also called immediately after. When `confirmLoading`
   * is supplied, the dialog stays open and the consumer owns closing (see below).
   */
  onConfirm: () => void;
  /** Dialog heading. */
  title: ReactNode;
  /** Optional body text elaborating on what will be confirmed. */
  description?: ReactNode;
  /** Confirm button label. Defaults to 'Confirm'. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** Confirm button tone. Defaults to 'primary'. */
  tone?: 'primary' | 'danger' | 'warning';
  /**
   * Opt into a managed async-confirm lifecycle. When this prop is provided (even
   * as `false`), the dialog **does not** auto-close on confirm — the consumer
   * keeps it open and closes it (via `open`) once the async work resolves. While
   * `true`, the confirm button shows a spinner and is disabled (blocking
   * re-confirm), and the dialog cannot be dismissed (cancel/Esc/backdrop are
   * blocked) until the pending work settles.
   */
  confirmLoading?: boolean;
  /** Screen-reader-only text announced while `confirmLoading` (e.g. 'Deleting…'). */
  loadingText?: string;
  /** Override initial focus. Defaults to the confirm button. */
  initialFocus?: DialogProps['initialFocus'];
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  confirmLoading,
  loadingText,
  initialFocus,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  // Associate the description with the dialog via aria-describedby (only when a
  // description is actually rendered).
  const descriptionId = useId('confirm-dialog-description');
  // Providing `confirmLoading` (even as false) opts into managed mode: the
  // consumer owns closing, so confirm doesn't auto-close.
  const managed = confirmLoading !== undefined;
  const handleConfirm = () => {
    onConfirm();
    if (!managed) onOpenChange(false);
  };
  // Block dismissal (cancel/Esc/backdrop) while a confirm is pending.
  const requestClose = (next: boolean) => {
    if (!next && confirmLoading) return;
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={requestClose}
      title={title}
      size="sm"
      // While a confirm is pending, make the dialog truly non-dismissable so the
      // native <dialog> cancel (Esc) is preventDefault'd. Without this, Esc runs
      // the browser's dialog.close() and the React `open` guard in requestClose
      // leaves the component stuck closed (open stays true, never re-shown).
      dismissable={!confirmLoading}
      aria-describedby={description ? descriptionId : undefined}
      initialFocus={initialFocus ?? confirmRef}
      footer={
        <>
          <Button
            variant="ghost"
            tone="neutral"
            disabled={confirmLoading || undefined}
            onClick={() => requestClose(false)}
          >
            {cancelLabel}
          </Button>
          <LoadingButton
            ref={confirmRef}
            variant="solid"
            tone={tone}
            loading={confirmLoading ?? false}
            loadingText={loadingText}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </LoadingButton>
        </>
      }
    >
      {description ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}
    </Dialog>
  );
}
