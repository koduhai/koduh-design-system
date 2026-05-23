import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId, composeEventHandlers } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Tooltip.module.css';

export interface TooltipProps {
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
  { content, placement = 'top', delay = 200, className, children },
  ref,
) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId('tooltip');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const scheduleOpen = () => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  };

  const close = () => {
    clear();
    setOpen(false);
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
    onMouseLeave: composeEventHandlers(children.props.onMouseLeave, close),
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
      className={cx(styles.tooltip, className)}
    >
      {content}
    </Popover>
  );
});
