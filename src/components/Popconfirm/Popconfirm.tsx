import { cloneElement, useEffect, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { Button } from '../Button';
import type { ButtonTone } from '../Button';
import { composeEventHandlers, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
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

  // When composed inside a <FormField>, the dialog is a role="dialog" composite
  // that <label htmlFor> can't target, so it defers its id/label/description/state
  // to the field (aria-labelledby/-describedby/-invalid/-required). Standalone, it
  // labels itself from `title` and falls back to a default name when none is given.
  const field = useOptionalFieldContext();

  const reactId = useId('popconfirm');
  const baseId = field?.id ?? reactId;
  const titleId = title != null ? `${baseId}-title` : undefined;
  const messageId = `${baseId}-message`;

  // role="dialog" needs an accessible name; with no title and no field label,
  // fall back to a sensible default so it never goes unnamed.
  const ariaLabelledBy = field ? field.labelId : titleId;
  const ariaLabel = ariaLabelledBy == null ? 'Confirm action' : undefined;
  const ariaDescribedBy = field?.describedById ?? messageId;
  const ariaInvalid = field?.invalid || undefined;
  const ariaRequired = field?.required || undefined;

  // This panel is role="dialog", so it owns focus: move focus in on open, trap
  // Tab within it, and return focus to the opener on close. Popover itself does
  // no focus management (it's the shared low-level floating primitive), so a
  // composing dialog has to supply it or keyboard/SR users tab straight past the
  // Confirm/Cancel buttons and focus is orphaned when it closes.
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const getFocusable = () => {
    const panel = panelRef.current;
    if (!panel) return [] as HTMLElement[];
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  };

  useEffect(() => {
    if (isOpen) {
      // Capture the opener before focus moves into the panel so we can restore it.
      restoreRef.current = restoreRef.current ?? (document.activeElement as HTMLElement | null);
      getFocusable()[0]?.focus();
    } else if (restoreRef.current) {
      restoreRef.current.focus();
      restoreRef.current = null;
    }
    // getFocusable reads refs only; safe to omit from deps.
  }, [isOpen]);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
      ref={panelRef}
      id={baseId}
      open={isOpen}
      onOpenChange={setOpen}
      placement={placement}
      role="dialog"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      trigger={clonedTrigger}
      className={cx(styles.panel, className)}
      onKeyDown={onPanelKeyDown}
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
