import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { composeEventHandlers, mergeRefs, useId } from '../../primitives';
import styles from './Menu.module.css';

export interface MenuItemConfig {
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface MenuSeparator {
  type: 'separator';
}

export type MenuEntry = MenuItemConfig | MenuSeparator;

export interface MenuProps {
  /** The element that toggles the menu. Rendered via Popover's Slot; Menu wires open/close + ARIA onto it. */
  trigger: ReactElement;
  /** Menu entries — actionable items and separators, in order. */
  items: MenuEntry[];
  /** Anchored placement of the menu panel. Defaults to 'bottom-start'. */
  placement?: PopoverPlacement;
  className?: string;
}

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return (entry as MenuSeparator).type === 'separator';
}

/** `ref` forwards to the trigger element, not the menu panel. */
export const Menu = /* @__PURE__ */ forwardRef<HTMLElement, MenuProps>(function Menu(
  { trigger, items, placement = 'bottom-start', className },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const menuId = useId('menu');
  const itemId = (i: number) => `${menuId}-item-${i}`;
  const menuRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  // Indices into `items` that are selectable (not a separator, not disabled).
  const itemIndices = items.reduce<number[]>((acc, entry, i) => {
    if (!isSeparator(entry) && !entry.disabled) acc.push(i);
    return acc;
  }, []);

  const activate = (entry: MenuItemConfig) => {
    if (entry.disabled) return;
    entry.onSelect();
    setOpen(false);
  };

  // Roving move over the selectable indices, wrapping at both ends.
  const move = (delta: number) => {
    if (itemIndices.length === 0) return;
    const pos = itemIndices.indexOf(activeIndex);
    const n = itemIndices.length;
    const nextPos = pos < 0 ? (delta > 0 ? 0 : n - 1) : (pos + delta + n) % n;
    const next = itemIndices[nextPos];
    if (next !== undefined) setActiveIndex(next);
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home': {
        event.preventDefault();
        const first = itemIndices[0];
        if (first !== undefined) setActiveIndex(first);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = itemIndices[itemIndices.length - 1];
        if (last !== undefined) setActiveIndex(last);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const entry = activeIndex >= 0 ? items[activeIndex] : undefined;
        if (entry && !isSeparator(entry)) activate(entry);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  };

  // Focus the menu when it opens (keyboard nav). Active index starts unset (-1)
  // so the menu has no highlighted item until the user arrows in — the first
  // ArrowDown then lands on the first enabled item (standard menu behavior).
  // On close, reset and return focus to the trigger (a11y), unless this is the
  // initial mount. Mirrors Select's open/close effect.
  useEffect(() => {
    if (open) {
      menuRef.current?.focus();
      setActiveIndex(-1);
    } else {
      setActiveIndex(-1);
      if (wasOpen.current) triggerRef.current?.focus();
    }
    wasOpen.current = open;
    // Intentionally keyed only on `open`: re-seeding on every items change would
    // fight user navigation. Mirrors the Popover/Select open/close effect.
  }, [open]);

  const typedTrigger = trigger as ReactElement<HTMLAttributes<HTMLElement>>;
  const clonedTrigger = cloneElement(typedTrigger, {
    // Popover's Slot merges its own anchor ref on top of this via mergeRefs,
    // so `triggerRef` and the anchor wiring both land on the element.
    ref: mergeRefs(triggerRef, ref),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: composeEventHandlers(typedTrigger.props.onClick, () => setOpen((o) => !o)),
  } as HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> });

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      role="presentation"
      trigger={clonedTrigger}
      className={className}
    >
      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        tabIndex={-1}
        aria-activedescendant={activeIndex >= 0 ? itemId(activeIndex) : undefined}
        onKeyDown={onMenuKeyDown}
        className={styles.menu}
      >
        {items.map((entry, i) =>
          isSeparator(entry) ? (
            <li key={itemId(i)} role="separator" className={styles.separator} />
          ) : (
            <li key={itemId(i)} role="none">
              <button
                role="menuitem"
                id={itemId(i)}
                type="button"
                className={styles.item}
                data-active={i === activeIndex || undefined}
                disabled={entry.disabled}
                tabIndex={-1}
                onClick={() => activate(entry)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {entry.icon != null ? <span className={styles.icon}>{entry.icon}</span> : null}
                {entry.label}
              </button>
            </li>
          ),
        )}
      </ul>
    </Popover>
  );
});
