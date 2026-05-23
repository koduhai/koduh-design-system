import { forwardRef, useEffect, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Slot, mergeRefs, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Popover.module.css';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the requested next open state (trigger toggle, Esc, outside click). */
  onOpenChange?: (open: boolean) => void;
  /** The anchor element. Rendered via Slot so anchor wiring merges onto your element. */
  trigger: ReactElement;
  /** Anchored placement. Defaults to 'bottom'. */
  placement?: PopoverPlacement;
  /** Gap (px) between anchor and panel. Defaults to 8. */
  offset?: number;
  /** Allow Esc / outside-click to request close. Default true. */
  dismissable?: boolean;
  /** ARIA role for the floating panel; consumers set 'listbox' | 'menu' | 'tooltip' | 'dialog'. */
  role?: string;
  children: ReactNode;
}

export const Popover = /* @__PURE__ */ forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    open,
    defaultOpen = false,
    onOpenChange,
    trigger,
    placement = 'bottom',
    offset = 8,
    dismissable = true,
    role,
    className,
    children,
    ...props
  },
  forwardedRef,
) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorName = `--${useId('ku-anchor')}`;

  // Sync open → native Popover API top layer, degrading gracefully (see Snackbar).
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof el.showPopover !== 'function') return;
    el.setAttribute('popover', 'manual');
    try {
      if (isOpen) el.showPopover();
      else el.hidePopover();
    } catch {
      /* already in target state */
    }
    let opened = false;
    try {
      opened = el.matches(':popover-open');
    } catch {
      /* :popover-open unsupported (e.g. jsdom) — treat as not opened */
    }
    if (isOpen && !opened) el.removeAttribute('popover');
  }, [isOpen]);

  // Esc + outside-pointerdown dismissal (works in jsdom and all browsers).
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, dismissable, setOpen]);

  // Custom-property style keys. This project's @types/react removed the
  // CSSProperties index signature (closed typing), so the literal object is
  // asserted to CSSProperties as a whole — the keys themselves are written
  // verbatim (no per-key cast), preserving the exact emitted variable names
  // that the CSS module reads.
  const triggerStyle = { ['--ku-anchor-name']: anchorName } as CSSProperties;
  const panelStyle = {
    ['--ku-anchor-name']: anchorName,
    ['--ku-popover-offset']: `${offset}px`,
  } as CSSProperties;

  return (
    <>
      <Slot ref={triggerRef as Ref<HTMLElement>} className={styles.anchor} style={triggerStyle}>
        {trigger}
      </Slot>
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        role={role}
        data-placement={placement}
        data-open={isOpen ? 'true' : 'false'}
        style={panelStyle}
        className={cx(styles.panel, className)}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
