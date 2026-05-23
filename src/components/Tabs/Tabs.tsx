import { forwardRef, useRef } from 'react';
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
}

export const Tabs = /* @__PURE__ */ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, value, defaultValue, onChange, orientation = 'horizontal', className, ...props },
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
              tabIndex={isSelected ? 0 : -1}
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
            {item.content}
          </div>
        );
      })}
    </div>
  );
});
