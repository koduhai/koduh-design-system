import { Dialog } from './Dialog';
import { Button } from '../Button';
import type { ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  /** Controls whether the dialog is visible. */
  open: boolean;
  /** Called with `false` when the dialog requests to close (cancel, Esc, backdrop). */
  onOpenChange: (open: boolean) => void;
  /** Called when the user presses confirm; `onOpenChange(false)` is also called. */
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
  tone?: 'primary' | 'danger';
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
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" tone="neutral" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="solid" tone={tone} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className={styles.description}>{description}</p> : null}
    </Dialog>
  );
}
