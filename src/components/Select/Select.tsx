import { forwardRef, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Popover } from '../Popover';
import { useControllableState, useId, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  /** Value submitted/compared when this option is chosen. */
  value: string;
  /** Visible option text (kept a string so it renders in the closed trigger). */
  label: string;
  /** Renders the option non-selectable. */
  disabled?: boolean;
}

export interface SelectProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /**
   * Fires with the chosen value and the originating event. The event is a
   * generic `SyntheticEvent` (click or keydown) rather than a `ChangeEvent`:
   * a custom listbox selection has no native `change` event to forward.
   */
  onChange?: (value: string, event: React.SyntheticEvent) => void;
  /** The selectable options, in order. */
  options: SelectOption[];
  /** Text shown when no value is selected. Defaults to 'Select…'. */
  placeholder?: string;
  /** Visible label, associated with the trigger via aria-labelledby. */
  label?: ReactNode;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Puts the control in the error state (aria-invalid). */
  error?: boolean;
  /** Hint shown below the control. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Message shown below the control when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: SelectSize;
  /** Class applied to the root wrapper. */
  className?: string;
  /** Base id for the control; ids for the label/listbox/description derive from it. */
  id?: string;
}

/** `ref` forwards to the trigger `<button>`, not the listbox panel. */
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
    errorText,
    size = 'md',
    className,
    id,
  },
  ref,
) {
  const description = error ? errorText : helperText;
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const reactId = useId('select');
  const baseId = id ?? reactId;
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
          if (!options[i]?.disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = activeIndex >= 0 ? options[activeIndex] : undefined;
        if (active) choose(active, event);
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

  const wasOpen = useRef(false);

  // Focus the listbox when it opens (keyboard nav); seed the active index to the
  // currently selected option so arrow keys start from a sensible place.
  // On close, return focus to the trigger (Fix 1) unless this is the initial mount.
  // Fix 2: skip disabled options when seeding the active index.
  useEffect(() => {
    if (open) {
      listRef.current?.focus();
      const sel = options.findIndex((o) => o.value === selected && !o.disabled);
      setActiveIndex(sel);
    } else {
      setActiveIndex(-1);
      if (wasOpen.current) triggerRef.current?.focus();
    }
    wasOpen.current = open;
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
      aria-describedby={description != null ? `${baseId}-desc` : undefined}
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
      {description != null ? (
        <span
          id={`${baseId}-desc`}
          className={styles.helperText}
          data-error={error ? 'true' : undefined}
        >
          {description}
        </span>
      ) : null}
    </div>
  );
});
