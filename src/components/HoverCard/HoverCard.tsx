import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId, composeEventHandlers } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './HoverCard.module.css';

export interface HoverCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'content'
> {
  /** The single trigger element (hover/focus target). */
  trigger: ReactElement<HTMLAttributes<HTMLElement>>;
  /** Arbitrary card content. */
  children: ReactNode;
  /** Anchored placement. Defaults to 'bottom'. */
  placement?: PopoverPlacement;
  /** Delay (ms) before opening on hover/focus. Defaults to 300. */
  openDelay?: number;
  /** Delay (ms) before closing on leave/blur. Defaults to 150. */
  closeDelay?: number;
  /** Extra class on the floating card panel. */
  className?: string;
}

/**
 * A richer Tooltip: a floating card shown on hover/focus of a trigger, holding
 * arbitrary content rather than a plain label. Opens on pointer-enter AND
 * keyboard focus of the trigger and closes on leave/blur after `closeDelay`;
 * the card itself keeps it open while hovered (WCAG 1.4.13). The trigger gets
 * `aria-describedby`/`aria-details` pointing at the card. It is intentionally
 * NOT focus-trapping — it is a hovercard, not a dialog.
 *
 * `ref` forwards to the card panel (the floating element), not the trigger.
 */
export const HoverCard = /* @__PURE__ */ forwardRef<HTMLDivElement, HoverCardProps>(
  function HoverCard(
    {
      trigger,
      children,
      placement = 'bottom',
      openDelay = 300,
      closeDelay = 150,
      className,
      id: consumerId,
      onMouseEnter: panelMouseEnter,
      onMouseLeave: panelMouseLeave,
      ...rest
    },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const cardId = useId('hovercard');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // True while the pointer is over the card itself, so leaving the trigger can
    // schedule a close that the card cancels by being hovered.
    const overPanel = useRef(false);

    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };

    const scheduleOpen = () => {
      clear();
      timer.current = setTimeout(() => setOpen(true), openDelay);
    };

    // Immediate close (blur / Escape) — no grace period.
    const close = () => {
      clear();
      overPanel.current = false;
      setOpen(false);
    };

    // Deferred close used when the pointer leaves the trigger: give the user
    // time to move onto the card. If the card is (or becomes) hovered, stay open.
    const scheduleClose = () => {
      clear();
      timer.current = setTimeout(() => {
        if (!overPanel.current) setOpen(false);
      }, closeDelay);
    };

    const onPanelEnter = () => {
      overPanel.current = true;
      clear(); // cancel any pending close
    };

    const onPanelLeave = () => {
      overPanel.current = false;
      scheduleClose();
    };

    // Clear pending timer on unmount to avoid setState on an unmounted component.
    useEffect(() => {
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }, []);

    // Append cardId to any existing token-list value the consumer already set on
    // the trigger, rather than replacing it, so a separate description is kept.
    const mergeIds = (existing: string | undefined): string | undefined => {
      if (!open) return existing;
      return existing ? `${existing} ${cardId}` : cardId;
    };

    // Compose our handlers with the child's existing handlers so consumers keep theirs.
    // A consumer-passed `id` lands on the trigger (its own element), so it cannot
    // clobber the internal `cardId` that wires the trigger <-> card aria linkage.
    const triggerEl = cloneElement(trigger, {
      id: consumerId ?? trigger.props.id,
      'aria-describedby': mergeIds(trigger.props['aria-describedby']),
      'aria-details': mergeIds(trigger.props['aria-details']),
      onMouseEnter: composeEventHandlers(trigger.props.onMouseEnter, scheduleOpen),
      onMouseLeave: composeEventHandlers(trigger.props.onMouseLeave, scheduleClose),
      onFocus: composeEventHandlers(trigger.props.onFocus, scheduleOpen),
      onBlur: composeEventHandlers(trigger.props.onBlur, close),
      onKeyDown: composeEventHandlers(trigger.props.onKeyDown, (e: KeyboardEvent<HTMLElement>) => {
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
        trigger={triggerEl}
        className={cx(styles.root, className)}
        onMouseEnter={composeEventHandlers(panelMouseEnter, onPanelEnter)}
        onMouseLeave={composeEventHandlers(panelMouseLeave, onPanelLeave)}
        {...rest}
        // The card's own id wires the trigger <-> card aria linkage; keep it last
        // so nothing spread in `rest` can override it.
        id={cardId}
      >
        {children}
      </Popover>
    );
  },
);
