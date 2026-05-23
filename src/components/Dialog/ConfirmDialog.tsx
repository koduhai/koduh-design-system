import { Dialog } from './Dialog';
import { Button } from '../Button';
import type { ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
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
