import { cloneElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { Button } from '../Button';
import type { ButtonTone } from '../Button';
import { composeEventHandlers, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Popconfirm.module.css';

export interface PopconfirmProps {
  /** The element that opens the confirmation. Popconfirm wires open/close + ARIA onto it. */
  trigger: ReactElement;
  /** Optional heading shown above the message. */
  title?: ReactNode;
  /** The confirmation message. */
  children: ReactNode;
  /** Called when the user presses confirm; the popover then closes. */
  onConfirm: () => void;
  /** Called when the user presses cancel. */
  onCancel?: () => void;
  /** Confirm button label. Defaults to 'Confirm'. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** Confirm button tone. Defaults to 'primary'. */
  confirmTone?: ButtonTone;
  /** Controlled open state. */
  open?: boolean;
  /** Called with the requested next open state (trigger toggle, Esc, outside click, confirm/cancel). */
  onOpenChange?: (open: boolean) => void;
  /** Anchored placement of the panel. Defaults to 'top'. */
  placement?: PopoverPlacement;
  className?: string;
}

export function Popconfirm({
  trigger,
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  open,
  onOpenChange,
  placement = 'top',
  className,
}: PopconfirmProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: false,
    onChange: onOpenChange,
  });

  const baseId = useId('popconfirm');
  const titleId = title != null ? `${baseId}-title` : undefined;
  const messageId = `${baseId}-message`;

  // onConfirm fires before close, matching ConfirmDialog.
  const confirmAndClose = () => {
    onConfirm();
    setOpen(false);
  };
  const cancel = () => {
    onCancel?.();
    setOpen(false);
  };

  const typedTrigger = trigger as ReactElement<HTMLAttributes<HTMLElement>>;
  const clonedTrigger = cloneElement(typedTrigger, {
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? baseId : undefined,
    onClick: composeEventHandlers(typedTrigger.props.onClick, () => setOpen(!isOpen)),
  } as HTMLAttributes<HTMLElement>);

  return (
    <Popover
      id={baseId}
      open={isOpen}
      onOpenChange={setOpen}
      placement={placement}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      trigger={clonedTrigger}
      className={cx(styles.panel, className)}
    >
      {title != null ? (
        <span id={titleId} className={styles.title}>
          {title}
        </span>
      ) : null}
      <div id={messageId} className={styles.message}>
        {children}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" tone="neutral" size="sm" onClick={cancel}>
          {cancelLabel}
        </Button>
        <Button variant="solid" tone={confirmTone} size="sm" onClick={confirmAndClose}>
          {confirmLabel}
        </Button>
      </div>
    </Popover>
  );
}
