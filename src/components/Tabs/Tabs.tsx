import { forwardRef, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
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

  const enabledIndexes = items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index);
    return acc;
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    if (enabledIndexes.length === 0) return;
    const posInEnabled = enabledIndexes.indexOf(index);

    let targetIndex: number | null = null;
    if (event.key === nextKey) {
      const next = posInEnabled === -1 ? 0 : (posInEnabled + 1) % enabledIndexes.length;
      targetIndex = enabledIndexes[next] ?? null;
    } else if (event.key === prevKey) {
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
