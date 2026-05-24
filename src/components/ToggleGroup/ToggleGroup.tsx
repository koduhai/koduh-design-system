import { forwardRef, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useControllableState } from '../../primitives';
import { useOptionalFieldContext } from '../FormField';
import { cx } from '../../utils/cx';
import styles from './ToggleGroup.module.css';

export type ToggleGroupSize = 'sm' | 'md' | 'lg';
export type ToggleGroupTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';

export interface ToggleGroupItem {
  /** Stable identity; the controlled/uncontrolled value. */
  value: string;
  /** Visible content. Omit only when an icon-only item supplies `aria-label`. */
  label?: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Disables this item. */
  disabled?: boolean;
  /** Accessible name — required for icon-only items. */
  'aria-label'?: string;
}

export interface ToggleGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Item definitions. */
  items: ToggleGroupItem[];
  /** Selection mode. 'single' → radiogroup; 'multiple' → toggle-button group. Defaults to 'single'. */
  type?: 'single' | 'multiple';
  /** Controlled value: a string for 'single', a string[] for 'multiple'. */
  value?: string | string[];
  /** Uncontrolled initial value. */
  defaultValue?: string | string[];
  /** Fires with the next selection (string for 'single', string[] for 'multiple'). */
  onChange?: (value: string | string[]) => void;
  /** Defaults to 'md'. */
  size?: ToggleGroupSize;
  /** Shared tone vocabulary. Defaults to 'primary'. */
  tone?: ToggleGroupTone;
  /** Disables every item. */
  disabled?: boolean;
  /** Layout/keyboard axis. Defaults to 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
}

export const ToggleGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup(
    {
      items,
      type = 'single',
      value,
      defaultValue,
      onChange,
      size = 'md',
      tone = 'primary',
      disabled = false,
      orientation = 'horizontal',
      className,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) {
    const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

    // Compose with an ancestor <FormField>: defer the group's accessible name
    // (via aria-labelledby → the field's label), description, invalid, and
    // required wiring to it. Consumer-passed values always win. A radiogroup/
    // group can't use the label's htmlFor, hence aria-labelledby. Standalone
    // usage (no FormField) is unchanged — pass aria-label/aria-labelledby yourself.
    const field = useOptionalFieldContext();
    const rootId = id ?? field?.id;
    // aria-labelledby wins over aria-label per spec, so don't borrow the field's
    // label when the consumer gave an explicit aria-label — let theirs apply.
    const labelledby = ariaLabelledby ?? (ariaLabel ? undefined : field?.labelId);
    const describedby = ariaDescribedby ?? field?.describedById;
    const invalid = ariaInvalid ?? (field?.invalid ? true : undefined);
    const requiredAttr = field?.required ? true : undefined;

    const [selected, setSelected] = useControllableState<string | string[]>({
      value,
      defaultValue: defaultValue ?? (type === 'multiple' ? [] : ''),
      onChange: undefined,
    });

    const isSelected = (val: string): boolean =>
      type === 'multiple' ? (selected as string[]).includes(val) : selected === val;

    const toggle = (val: string) => {
      if (type === 'multiple') {
        const current = selected as string[];
        const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
        setSelected(next);
        onChange?.(next);
      } else {
        setSelected(val);
        onChange?.(val);
      }
    };

    const enabledIndexes = items.reduce<number[]>((acc, item, index) => {
      if (!item.disabled && !disabled) acc.push(index);
      return acc;
    }, []);

    // Initially-tabbable item: the first selected enabled item, else first enabled.
    const firstSelected = items.findIndex((item) => !item.disabled && isSelected(item.value));
    const [activeIndex, setActiveIndex] = useState(
      firstSelected >= 0 ? firstSelected : (enabledIndexes[0] ?? 0),
    );

    const focusAt = (index: number) => {
      setActiveIndex(index);
      btnRefs.current[index]?.focus();
      // 'single' uses radio auto-activation: moving focus also selects.
      if (type === 'single') {
        const item = items[index];
        if (item) toggle(item.value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      if (enabledIndexes.length === 0) return;
      const pos = enabledIndexes.indexOf(index);

      let target: number | null = null;
      if (event.key === nextKey) {
        const n = pos === -1 ? 0 : (pos + 1) % enabledIndexes.length;
        target = enabledIndexes[n] ?? null;
      } else if (event.key === prevKey) {
        const p =
          pos === -1
            ? enabledIndexes.length - 1
            : (pos - 1 + enabledIndexes.length) % enabledIndexes.length;
        target = enabledIndexes[p] ?? null;
      } else if (event.key === 'Home') {
        target = enabledIndexes[0] ?? null;
      } else if (event.key === 'End') {
        target = enabledIndexes[enabledIndexes.length - 1] ?? null;
      }

      if (target !== null) {
        event.preventDefault();
        focusAt(target);
      }
    };

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        role={type === 'single' ? 'radiogroup' : 'group'}
        id={rootId}
        aria-label={ariaLabel}
        aria-labelledby={labelledby}
        aria-describedby={describedby}
        aria-invalid={invalid}
        aria-required={requiredAttr}
        // aria-orientation is valid on radiogroup but not on a plain group, so
        // only emit it in single-select mode (CSS uses data-orientation anyway).
        aria-orientation={type === 'single' ? orientation : undefined}
        data-size={size}
        data-tone={tone}
        data-orientation={orientation}
        {...props}
      >
        {items.map((item, index) => {
          const checked = isSelected(item.value);
          const itemDisabled = disabled || item.disabled;
          return (
            <button
              key={item.value}
              ref={(node) => {
                btnRefs.current[index] = node;
              }}
              type="button"
              role={type === 'single' ? 'radio' : undefined}
              aria-checked={type === 'single' ? checked : undefined}
              aria-pressed={type === 'multiple' ? checked : undefined}
              aria-label={item['aria-label']}
              className={styles.item}
              disabled={itemDisabled}
              data-selected={checked ? 'true' : undefined}
              tabIndex={index === activeIndex ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => {
                if (itemDisabled) return;
                setActiveIndex(index);
                toggle(item.value);
              }}
            >
              {item.icon ? (
                <span className={styles.icon} aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </button>
          );
        })}
      </div>
    );
  },
);
