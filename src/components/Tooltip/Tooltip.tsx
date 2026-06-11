import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type {
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId, composeEventHandlers, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Tooltip.module.css';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
  /** Tooltip text/content. */
  content: ReactNode;
  /** Anchored placement. Defaults to 'top'. */
  placement?: PopoverPlacement;
  /** Open/close delay in ms. Defaults to 200. */
  delay?: number;
  /** Extra class on the tooltip panel. */
  className?: string;
  /** The single trigger element. */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}

/**
 * `ref` forwards to the tooltip panel (the floating element), not the trigger.
 *
 * Touch note: in addition to hover/focus, a touch tap on the trigger opens the
 * tooltip (touch devices have no hover and focus-on-tap is inconsistent across
 * mobile browsers). It stays dismissable by tapping elsewhere or pressing Esc.
 * Still, do not place critical, tooltip-only information here; surface it inline
 * or via a tap-activated control instead.
 */
export const Tooltip = /* @__PURE__ */ forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    content,
    placement = 'top',
    delay = 200,
    className,
    children,
    onMouseEnter: panelMouseEnter,
    onMouseLeave: panelMouseLeave,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId('tooltip');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Trigger node, used to keep a touch tap that opened the tooltip from also
  // counting as an outside tap that immediately dismisses it.
  const triggerRef = useRef<HTMLElement>(null);
  // True while the pointer is over the panel itself. WCAG 1.4.13 (Content on
  // Hover or Focus): the tooltip must be hoverable, so leaving the trigger
  // schedules a close that the panel can cancel by being hovered.
  const overPanel = useRef(false);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const scheduleOpen = () => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  };

  // Touch has no hover and focus-on-tap is unreliable on mobile, so reveal the
  // tooltip immediately on a touch tap of the trigger. Mouse/pen pointerdown is
  // ignored here so the existing hover/focus path stays the only desktop opener.
  const onTriggerPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'touch') return;
    clear();
    setOpen(true);
  };

  // Immediate close (blur / Escape) — no grace period.
  const close = () => {
    clear();
    overPanel.current = false;
    setOpen(false);
  };

  // Deferred close used when the pointer leaves the trigger: give the user time
  // to move onto the panel. If the panel is (or becomes) hovered, stay open.
  const scheduleClose = () => {
    clear();
    timer.current = setTimeout(() => {
      if (!overPanel.current) setOpen(false);
    }, delay);
  };

  const onPanelEnter = () => {
    overPanel.current = true;
    clear(); // cancel any pending close
  };

  const onPanelLeave = () => {
    overPanel.current = false;
    scheduleClose();
  };

  // Fix 1: Clear pending timer on unmount to avoid setState on an unmounted component.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // WCAG 1.4.13 (Content on Hover or Focus): the tooltip must be dismissable
  // without moving the pointer/focus. A hover-opened tooltip leaves the trigger
  // unfocused, so a trigger-level keydown never fires; listen on the document
  // while open instead. This only hides the tooltip (close()), so re-hovering or
  // re-focusing the trigger opens it again (no permanent suppression).
  // Touch dismissal: a touch tap opens the tooltip, so a subsequent tap anywhere
  // off the trigger and off the (hoverable) panel should close it again. We scope
  // this to touch pointers so a desktop click on the trigger does not fight the
  // hover/focus path. The trigger's own opening tap is excluded by the
  // contains() checks, which also avoids the tap-toggle race.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      // The floating panel carries role="tooltip"; treat a tap inside it as
      // inside so tapping the (hoverable) content does not dismiss it.
      if (target instanceof Element && target.closest('[role="tooltip"]')) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  // Merge our tooltip id with any aria-describedby the child already carries
  // (e.g. a trigger that also points at a helper-text id) so we don't clobber it.
  const describedBy =
    [children.props['aria-describedby'], open ? tooltipId : undefined].filter(Boolean).join(' ') ||
    undefined;

  // Fix 2: Compose our handlers with the child's existing handlers so consumers don't lose theirs.
  // The child's existing ref (if any) is preserved by merging it with our triggerRef.
  const childRef = (children as ReactElement & { ref?: Ref<HTMLElement> }).ref;
  const trigger = cloneElement(children, {
    ref: mergeRefs(triggerRef, childRef),
    'aria-describedby': describedBy,
    onMouseEnter: composeEventHandlers(children.props.onMouseEnter, scheduleOpen),
    // Deferred close: let the pointer travel onto the (now hoverable) panel.
    onMouseLeave: composeEventHandlers(children.props.onMouseLeave, scheduleClose),
    onFocus: composeEventHandlers(children.props.onFocus, scheduleOpen),
    onBlur: composeEventHandlers(children.props.onBlur, close),
    // Touch tap reveals the tooltip (no hover/reliable focus on touch).
    onPointerDown: composeEventHandlers(
      (children.props as HTMLAttributes<HTMLElement>).onPointerDown,
      onTriggerPointerDown,
    ),
  } as Partial<HTMLAttributes<HTMLElement>> & { ref?: Ref<HTMLElement> });

  return (
    <Popover
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      dismissable={false}
      placement={placement}
      role="tooltip"
      id={tooltipId}
      trigger={trigger}
      className={cx(styles.root, className)}
      onMouseEnter={composeEventHandlers(panelMouseEnter, onPanelEnter)}
      onMouseLeave={composeEventHandlers(panelMouseLeave, onPanelLeave)}
      {...rest}
    >
      {content}
    </Popover>
  );
});
