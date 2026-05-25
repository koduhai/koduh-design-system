import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId, composeEventHandlers } from '../../primitives';
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

/** `ref` forwards to the tooltip panel (the floating element), not the trigger. */
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

  // Fix 2: Compose our handlers with the child's existing handlers so consumers don't lose theirs.
  const trigger = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: composeEventHandlers(children.props.onMouseEnter, scheduleOpen),
    // Deferred close: let the pointer travel onto the (now hoverable) panel.
    onMouseLeave: composeEventHandlers(children.props.onMouseLeave, scheduleClose),
    onFocus: composeEventHandlers(children.props.onFocus, scheduleOpen),
    onBlur: composeEventHandlers(children.props.onBlur, close),
    onKeyDown: composeEventHandlers(children.props.onKeyDown, (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') close();
    }),
  });

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
