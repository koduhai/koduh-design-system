import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Slot, mergeRefs, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Popover.module.css';

/**
 * Does this engine support CSS anchor positioning? Chromium does; Firefox/Safari
 * do not (yet). When unsupported we fall back to JS positioning (see below).
 * Evaluated lazily/guarded so it's safe in jsdom and SSR.
 */
function supportsAnchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    ? CSS.supports('anchor-name: --x')
    : false;
}

/**
 * Compute `position: fixed` top/left for the panel from the trigger rect, the
 * panel's own size, the requested `placement`, and the gap `offset`. Clamps to
 * the viewport so the panel never spills off-screen. This is the no-frills
 * fallback for engines without CSS anchor positioning — it honors the requested
 * placement plus edge clamping, not full collision flipping.
 */
function computePosition(
  anchor: DOMRect,
  panel: { width: number; height: number },
  placement: PopoverPlacement,
  offset: number,
): { top: number; left: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const [side, align] = placement.split('-') as [string, string | undefined];

  let top = 0;
  let left = 0;

  // Main-axis placement (which side of the anchor the panel sits on).
  switch (side) {
    case 'top':
      top = anchor.top - panel.height - offset;
      break;
    case 'bottom':
      top = anchor.bottom + offset;
      break;
    case 'left':
      left = anchor.left - panel.width - offset;
      break;
    case 'right':
      left = anchor.right + offset;
      break;
    default:
      top = anchor.bottom + offset;
  }

  // Cross-axis alignment.
  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = anchor.left;
    else if (align === 'end') left = anchor.right - panel.width;
    else left = anchor.left + (anchor.width - panel.width) / 2;
  } else if (side === 'left' || side === 'right') {
    if (align === 'start') top = anchor.top;
    else if (align === 'end') top = anchor.bottom - panel.height;
    else top = anchor.top + (anchor.height - panel.height) / 2;
  }

  // Clamp to the viewport (8px breathing room), only when the viewport is known.
  if (vw > 0) left = Math.max(8, Math.min(left, vw - panel.width - 8));
  if (vh > 0) top = Math.max(8, Math.min(top, vh - panel.height - 8));

  return { top, left };
}

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
  /**
   * The anchor element. Rendered via `Slot`, which merges only the anchor wiring
   * (anchor-name custom property + ref) onto your element.
   *
   * Opening/closing is the CALLER's responsibility: wire your own `onClick`
   * (or hover/focus) on this element to drive `open`/`onOpenChange`. Likewise,
   * trigger ARIA (`aria-expanded`, `aria-haspopup`, `aria-controls`, or
   * `aria-describedby`) lives on your element, not here — it is intentionally
   * consumer-specific because the correct `haspopup` value and the
   * controls-vs-describedby choice differ per pattern (listbox/menu/tooltip).
   * The composing components (`Select`, `Menu`, `Tooltip`) each supply it.
   */
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

  // JS positioning fallback for engines without CSS anchor positioning
  // (Firefox/Safari today). `null` means "use the CSS-anchor path" — we never
  // touch top/left there so Chromium is never regressed.
  const supportsAnchor = supportsAnchorPositioning();
  const [fallbackPos, setFallbackPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (supportsAnchor) return; // CSS anchor path handles positioning.
    if (!isOpen) {
      setFallbackPos(null);
      return;
    }
    const reposition = () => {
      const triggerEl = triggerRef.current;
      const panelEl = panelRef.current;
      if (!triggerEl || !panelEl) return;
      const anchorRect = triggerEl.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();
      setFallbackPos(
        computePosition(
          anchorRect,
          { width: panelRect.width, height: panelRect.height },
          placement,
          offset,
        ),
      );
    };
    reposition();
    // Capture-phase scroll so we react to any ancestor scroll, not just window.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [supportsAnchor, isOpen, placement, offset]);

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
    // JS positioning fallback: when CSS anchor positioning is unsupported we set
    // explicit fixed coordinates and zero the offset margin (the gap is already
    // baked into top/left). Left untouched on the CSS-anchor path.
    ...(!supportsAnchor && fallbackPos
      ? { position: 'fixed', top: fallbackPos.top, left: fallbackPos.left, margin: 0 }
      : null),
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
