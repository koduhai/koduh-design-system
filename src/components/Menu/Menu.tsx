import { cloneElement, forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { composeEventHandlers, mergeRefs, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import styles from './Menu.module.css';

/**
 * Menu density. Mirrors the `[data-density]` token mechanism (`--ku-density-*`
 * vars). `comfortable` is the default; `compact` tightens item padding without
 * dropping the hit-target floor. Same literal as Table/TextField/Select.
 */
export type Density = 'comfortable' | 'compact';

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

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The element that toggles the menu. Rendered via Popover's Slot; Menu wires open/close + ARIA onto it. */
  trigger: ReactElement;
  /** Menu entries — actionable items and separators, in order. */
  items: MenuEntry[];
  /** Anchored placement of the menu panel. Defaults to 'bottom-start'. */
  placement?: PopoverPlacement;
  /**
   * Menu density. `compact` tightens item padding via the `--ku-density-*` vars.
   * Omit to inherit a `data-density` ancestor (defaults to comfortable); set
   * explicitly to set `data-density` on the menu list.
   */
  density?: Density;
  className?: string;
}

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return (entry as MenuSeparator).type === 'separator';
}

/** `ref` forwards to the trigger element, not the menu panel. */
export const Menu = /* @__PURE__ */ forwardRef<HTMLElement, MenuProps>(function Menu(
  { trigger, items, placement = 'bottom-start', density, className, ...rest },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // The trigger is a `aria-haspopup="menu"` button wrapper that a FormField's
  // `<label htmlFor>` cannot target, so when wrapped in a <FormField> we wire the
  // group-style association (aria-labelledby/describedby/invalid/required) plus
  // the field id. Standalone (no field context) this is a no-op.
  const field = useOptionalFieldContext();

  const menuId = useId('menu');
  const itemId = (i: number) => `${menuId}-item-${i}`;
  const menuRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  // Only restore focus to the trigger on keyboard-initiated closes (Escape /
  // selection), never on an outside-pointer dismiss — that would yank focus
  // away from wherever the user just clicked (WCAG: predictable focus).
  const restoreFocus = useRef(false);
  // Which item to highlight when the menu next opens: 'first' (default), 'last'
  // (ArrowUp from the trigger). The open effect consumes and clears this.
  const pendingSeed = useRef<'first' | 'last'>('first');
  // First-letter typeahead state: the accumulated query and the timer that
  // resets it after a short idle, per the WAI-ARIA menu keyboard pattern.
  const typeahead = useRef('');
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Indices into `items` that are selectable (not a separator, not disabled).
  const itemIndices = items.reduce<number[]>((acc, entry, i) => {
    if (!isSeparator(entry) && !entry.disabled) acc.push(i);
    return acc;
  }, []);

  const activate = (entry: MenuItemConfig) => {
    if (entry.disabled) return;
    entry.onSelect();
    restoreFocus.current = true; // keyboard/pointer selection → return focus to trigger
    setOpen(false);
  };

  // Open from the trigger via keyboard, seeding which item to highlight.
  // 'first' (ArrowDown/Enter/Space) lands on the first enabled item; 'last'
  // (ArrowUp) on the last; per the WAI-ARIA menu-button pattern. The open
  // effect reads `pendingSeed` to set the active index after it opens.
  const openFrom = (which: 'first' | 'last') => {
    pendingSeed.current = which;
    setOpen(true);
  };

  // First-letter typeahead: accumulate printable characters and move the active
  // item to the next selectable item whose (string) label starts with the query,
  // searching forward from the current item and wrapping. Items with non-string
  // labels are skipped (no reliable text to match). Per the WAI-ARIA menu pattern.
  const onTypeahead = (key: string) => {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = setTimeout(() => {
      typeahead.current = '';
    }, 500);
    typeahead.current += key.toLowerCase();
    const query = typeahead.current;
    if (itemIndices.length === 0) return;
    const startPos = itemIndices.indexOf(activeIndex);
    const n = itemIndices.length;
    // When nothing is active yet (startPos === -1) begin the search at the first
    // item so it can match; otherwise search forward from the item after active.
    const base = startPos < 0 ? -1 : startPos;
    for (let step = 1; step <= n; step += 1) {
      const idx = itemIndices[(base + step) % n];
      if (idx === undefined) continue;
      const entry = items[idx];
      if (!entry || isSeparator(entry)) continue;
      const { label } = entry;
      if (typeof label === 'string' && label.toLowerCase().startsWith(query)) {
        setActiveIndex(idx);
        return;
      }
    }
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
        restoreFocus.current = true; // keyboard close → return focus to trigger
        setOpen(false);
        break;
      default:
        // First-letter typeahead: a single printable character with no modifier.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          onTypeahead(event.key);
        }
        break;
    }
  };

  // Focus the menu when it opens (keyboard nav) and seed the active item so
  // `aria-activedescendant` points at a real item (the first enabled item by
  // default, the last when opened via ArrowUp) — otherwise nothing is announced.
  // On close, reset; and return focus to the trigger ONLY for keyboard-initiated
  // closes (Escape / selection), never an outside-pointer dismiss.
  useEffect(() => {
    if (open) {
      menuRef.current?.focus();
      const seed =
        pendingSeed.current === 'last' ? itemIndices[itemIndices.length - 1] : itemIndices[0];
      setActiveIndex(seed ?? -1);
      pendingSeed.current = 'first';
    } else {
      setActiveIndex(-1);
      if (wasOpen.current && restoreFocus.current) triggerRef.current?.focus();
      restoreFocus.current = false;
      // Reset any in-flight typeahead query so a reopen starts clean.
      typeahead.current = '';
      if (typeaheadTimer.current) {
        clearTimeout(typeaheadTimer.current);
        typeaheadTimer.current = null;
      }
    }
    wasOpen.current = open;
    // Intentionally keyed only on `open`: re-seeding on every items change would
    // fight user navigation. Mirrors the Popover/Select open/close effect.
  }, [open]);

  // Clear the typeahead reset timer on unmount so it never fires after teardown.
  useEffect(
    () => () => {
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    },
    [],
  );

  // WAI-ARIA menu-button keyboard: open on ArrowDown/ArrowUp/Enter/Space.
  // ArrowDown opens to the first enabled item, ArrowUp to the last.
  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        openFrom('first');
        break;
      case 'ArrowUp':
        event.preventDefault();
        openFrom('last');
        break;
      default:
        break;
    }
  };

  const typedTrigger = trigger as ReactElement<HTMLAttributes<HTMLElement>>;
  const clonedTrigger = cloneElement(typedTrigger, {
    // Popover's Slot merges its own anchor ref on top of this via mergeRefs,
    // so `triggerRef` and the anchor wiring both land on the element.
    ref: mergeRefs(triggerRef, ref),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    // FormField association: the trigger is a button wrapper, so use the group
    // attributes (aria-labelledby points at the field label). Without a field
    // context these stay undefined and the trigger keeps its own props.
    // aria-invalid / aria-required are not valid on the trigger's button role
    // (axe aria-allowed-attr), so only the name/description associations are wired.
    ...(field
      ? {
          id: field.id,
          'aria-labelledby': field.labelId,
          'aria-describedby': field.describedById,
        }
      : null),
    onClick: composeEventHandlers(typedTrigger.props.onClick, () => setOpen((o) => !o)),
    onKeyDown: composeEventHandlers(typedTrigger.props.onKeyDown, onTriggerKeyDown),
  } as HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> });

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      role="presentation"
      trigger={clonedTrigger}
      className={cx(styles.root, className)}
      {...rest}
    >
      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        data-density={density}
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
                // Use aria-disabled (not the native `disabled` attribute) so the
                // item stays in the accessibility tree and is announced as
                // dimmed/unavailable rather than dropped by screen readers.
                // Mirrors sibling Select (aria-disabled on options). Activation is
                // still blocked by `activate()` guarding on entry.disabled.
                aria-disabled={entry.disabled || undefined}
                tabIndex={-1}
                onClick={() => activate(entry)}
                onMouseEnter={() => !entry.disabled && setActiveIndex(i)}
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
