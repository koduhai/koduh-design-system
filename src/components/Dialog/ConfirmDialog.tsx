import { Dialog } from './Dialog';
import { Button } from '../Button';
import type { ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  /** Controls whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog requests to be closed (cancel or backdrop). */
  onClose: () => void;
  /** Called when the user presses the confirm button; `onClose` is also called. */
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
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" tone="neutral" onClick={onClose}>
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
