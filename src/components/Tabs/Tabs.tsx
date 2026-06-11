import { forwardRef, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Tabs.module.css';

export interface TabItem {
  /** Stable identity; used as the controlled/uncontrolled value. */
  id: string;
  /** Content rendered inside the tab trigger button. */
  label: ReactNode;
  /** Content rendered inside the associated tab panel. */
  content: ReactNode;
  /** Disables the tab trigger; the panel is never shown while disabled. */
  disabled?: boolean;
}

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Tab definitions — each item produces one trigger + one panel pair. */
  items: TabItem[];
  /** Controlled selected tab id. */
  value?: string;
  /** Initial selected tab id when uncontrolled. Defaults to the first non-disabled item. */
  defaultValue?: string;
  /** Fires with the newly selected tab id. */
  onChange?: (value: string) => void;
  /** Layout/keyboard axis. Defaults to 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Defer rendering an inactive panel's content until it is first activated.
   * Defaults to `false` (eager — every panel's content is rendered up front).
   */
  lazy?: boolean;
  /**
   * Once a panel has been shown, keep it mounted (hidden via `hidden`/CSS)
   * instead of unmounting it when it becomes inactive. Defaults to `false`.
   */
  keepMounted?: boolean;
}

export const Tabs = /* @__PURE__ */ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    value,
    defaultValue,
    onChange,
    orientation = 'horizontal',
    lazy = false,
    keepMounted = false,
    className,
    ...props
  },
  ref,
) {
  const baseId = useId('tabs');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const firstEnabled = items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? '';

  const [selected, setSelected] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? firstEnabled,
    onChange: undefined,
  });

  // Track which panels have ever been the active panel. Used by `lazy`
  // (defer first render until shown) and `keepMounted` (stay mounted once
  // shown). The currently-selected panel is always considered shown.
  const [shownIds, setShownIds] = useState<Set<string>>(() => new Set(selected ? [selected] : []));
  if (selected && !shownIds.has(selected)) {
    setShownIds((prev) => {
      if (prev.has(selected)) return prev;
      const next = new Set(prev);
      next.add(selected);
      return next;
    });
  }
  const hasBeenShown = (id: string) => id === selected || shownIds.has(id);

  const select = (id: string) => {
    setSelected(id);
    onChange?.(id);
  };

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  const focusTabAt = (index: number) => {
    const item = items[index];
    if (!item) return;
    select(item.id);
    tabRefs.current[index]?.focus();
  };

  // Build the list of item indexes that can be navigated to (non-disabled tabs only).
  // Arrow keys step through this list rather than the full `items` array, so
  // disabled tabs are transparently skipped.
  const enabledIndexes = items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index);
    return acc;
  }, []);

  // Roving-tabindex entry point: the tab that carries tabindex 0 (the rest are
  // -1). Normally that is the selected tab, but if the selected tab is disabled
  // it cannot be a keyboard entry point, so fall back to the first enabled tab.
  // This keeps the tablist reachable by Tab as long as any tab is enabled.
  const selectedItem = items.find((item) => item.id === selected);
  const tabStopId =
    selectedItem && !selectedItem.disabled
      ? selected
      : (items.find((item) => !item.disabled)?.id ?? undefined);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    if (enabledIndexes.length === 0) return;
    // Find the current tab's position within the enabled-only list.
    // posInEnabled === -1 means the focused tab is disabled; we treat it as a
    // boundary so the next/prev key jumps to the nearest enabled tab.
    const posInEnabled = enabledIndexes.indexOf(index);

    let targetIndex: number | null = null;
    if (event.key === nextKey) {
      // Roving-focus wrap-around: `% length` keeps the result in range.
      // posInEnabled === -1 fallback jumps to the first enabled tab.
      const next = posInEnabled === -1 ? 0 : (posInEnabled + 1) % enabledIndexes.length;
      targetIndex = enabledIndexes[next] ?? null;
    } else if (event.key === prevKey) {
      // `+ enabledIndexes.length` before `%` prevents a negative remainder in
      // JS (e.g. (-1 + 4) % 4 === 3 rather than -1 % 4 === -1).
      // posInEnabled === -1 fallback jumps to the last enabled tab.
      const prev =
        posInEnabled === -1
          ? enabledIndexes.length - 1
          : (posInEnabled - 1 + enabledIndexes.length) % enabledIndexes.length;
      targetIndex = enabledIndexes[prev] ?? null;
    } else if (event.key === 'Home') {
      targetIndex = enabledIndexes[0] ?? null;
    } else if (event.key === 'End') {
      targetIndex = enabledIndexes[enabledIndexes.length - 1] ?? null;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      // focusTabAt calls select() then moves DOM focus — this is deliberate
      // automatic-activation (ARIA "activates on focus") tablist behaviour.
      focusTabAt(targetIndex);
    }
  };

  return (
    <div ref={ref} className={cx(styles.root, className)} data-orientation={orientation} {...props}>
      <div className={styles.tablist} role="tablist" aria-orientation={orientation}>
        {items.map((item, index) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              className={styles.tab}
              aria-selected={isSelected}
              aria-controls={panelId(item.id)}
              tabIndex={item.id === tabStopId ? 0 : -1}
              disabled={item.disabled}
              data-selected={isSelected ? 'true' : undefined}
              onClick={() => {
                if (!item.disabled) select(item.id);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const isSelected = item.id === selected;
        const shown = hasBeenShown(item.id);
        // The panel element itself always stays mounted so the trigger's
        // `aria-controls` target and `tabpanel` role/labelling remain stable;
        // visibility is driven by `hidden` exactly as before. Only the panel's
        // *content* is gated by lazy/keepMounted:
        //   - eager (default): always render content (back-compatible).
        //   - lazy, never shown: omit content until first activation.
        //   - lazy, shown but now inactive: drop content unless keepMounted.
        let renderContent: boolean;
        if (isSelected) {
          renderContent = true;
        } else if (!lazy) {
          // Eager: content is always present. keepMounted is a no-op here
          // because nothing is ever unmounted.
          renderContent = true;
        } else {
          // Lazy and inactive: present only if shown before AND kept mounted.
          renderContent = shown && keepMounted;
        }
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={panelId(item.id)}
            className={styles.panel}
            aria-labelledby={tabId(item.id)}
            hidden={!isSelected}
            tabIndex={0}
          >
            {renderContent ? item.content : null}
          </div>
        );
      })}
    </div>
  );
});
