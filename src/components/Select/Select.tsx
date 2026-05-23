import { forwardRef, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Popover } from '../Popover';
import { useControllableState, useId, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Fires with the chosen value and the originating event. */
  onChange?: (value: string, event: React.SyntheticEvent) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  size?: SelectSize;
  className?: string;
  id?: string;
}

export const Select = /* @__PURE__ */ forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    defaultValue,
    onChange,
    options,
    placeholder = 'Select…',
    label,
    disabled,
    error,
    helperText,
    size = 'md',
    className,
    id,
  },
  ref,
) {
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const baseId = useId(id ?? 'select');
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === selected);

  const choose = (opt: SelectOption, event: React.SyntheticEvent) => {
    if (opt.disabled) return;
    setSelected(opt.value);
    onChange?.(opt.value, event);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    const n = options.length;
    let i = activeIndex;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (!options[i]?.disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(options.findIndex((o) => !o.disabled));
        break;
      case 'End':
        event.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i].disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) choose(options[activeIndex], event);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  };

  // Focus the listbox when it opens (keyboard nav); seed the active index to the
  // currently selected option so arrow keys start from a sensible place.
  useEffect(() => {
    if (open) {
      listRef.current?.focus();
      const sel = options.findIndex((o) => o.value === selected);
      setActiveIndex(sel);
    } else {
      setActiveIndex(-1);
    }
    // Intentionally keyed only on `open`: re-seeding on every options/selected
    // change would fight user navigation. Mirrors the Popover open/close effect.
  }, [open]);

  const trigger = (
    <button
      ref={mergeRefs(triggerRef, ref)}
      type="button"
      id={baseId}
      className={styles.trigger}
      data-size={size}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      aria-labelledby={label ? `${labelId} ${baseId}` : undefined}
      aria-invalid={error || undefined}
      onClick={() => setOpen((o) => !o)}
    >
      <span className={selectedOption ? undefined : styles.placeholder}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <span aria-hidden>▾</span>
    </button>
  );

  return (
    <div className={cx(styles.root, className)}>
      {label != null ? (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      ) : null}
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-start"
        role="presentation"
        trigger={trigger}
      >
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={label ? labelId : undefined}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          className={styles.listbox}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              id={optionId(i)}
              role="option"
              aria-selected={opt.value === selected}
              aria-disabled={opt.disabled || undefined}
              data-active={i === activeIndex ? 'true' : undefined}
              className={styles.option}
              onClick={(e) => choose(opt, e)}
              onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </Popover>
      {helperText != null ? (
        <span className={styles.helperText} data-error={error ? 'true' : undefined}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
});
