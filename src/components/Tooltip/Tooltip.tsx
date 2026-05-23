import { cloneElement, forwardRef, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId } from '../../primitives';
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

  const trigger = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: scheduleOpen,
    onMouseLeave: close,
    onFocus: scheduleOpen,
    onBlur: close,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') close();
      children.props.onKeyDown?.(e);
    },
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
