import { forwardRef, useEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode, SyntheticEvent } from 'react';
import { Popover } from '../Popover';
import { Chip } from '../Chip';
import { useOptionalFieldContext } from '../FormField';
import { CloseIcon } from '../../icons';
import { composeEventHandlers, useControllableState, useId, mergeRefs } from '../../primitives';
import { useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * Control density. Mirrors the `[data-density]` token mechanism
 * (`--ku-density-*` vars). `comfortable` is the default; `compact` tightens the
 * trigger and option padding without dropping the hit-target floor. Same literal
 * as Table/TextField/Menu.
 */
export type Density = 'comfortable' | 'compact';

export interface SelectOption {
  /** Value submitted/compared when this option is chosen. */
  value: string;
  /** Visible option text (kept a string so it renders in the closed trigger). */
  label: string;
  /** Renders the option non-selectable. */
  disabled?: boolean;
}

interface SelectBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  // These collide with the component's own typed props; redeclared below.
  'value' | 'defaultValue' | 'onChange' | 'type' | 'className' | 'id'
> {
  /** The selectable options, in order. */
  options: SelectOption[];
  /** Text shown when no value is selected. Defaults to 'Select…'. */
  placeholder?: string;
  /**
   * Visible label, associated with the trigger via aria-labelledby. Omit it (and
   * wrap the control in a `<FormField>`) to let the field supply the label and
   * the error/required/aria wiring instead.
   */
  label?: ReactNode;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Puts the control in the error state (aria-invalid). */
  error?: boolean;
  /** Marks the field required: shows the indicator and sets aria-required. */
  required?: boolean;
  /** Hint shown below the control. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Message shown below the control when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: SelectSize;
  /**
   * Control density. `compact` tightens the trigger and option padding via the
   * `--ku-density-*` vars. Omit to inherit a `data-density` ancestor (defaults
   * to comfortable); set explicitly to set `data-density` on the root + listbox.
   */
  density?: Density;
  /**
   * Shows a clear affordance when a value is selected. Clearing resets the
   * value and fires `onChange('', event)` (single) / `onChange([], event)`
   * (multi) — the empty value is the "no selection" signal, so consumers no
   * longer need a synthetic empty `{ label, value: '' }` option.
   */
  clearable?: boolean;
  /**
   * Accessible label for the clear button. Overrides the i18n catalog's
   * `clearSelection` (default 'Clear selection').
   */
  clearLabel?: string;
  /** Class applied to the root wrapper. */
  className?: string;
  /** Base id for the control; ids for the label/listbox/description derive from it. */
  id?: string;
}

/** Single-select (default): value is a string, `''` means no selection. */
export interface SelectSingleProps extends SelectBaseProps {
  multiple?: false;
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /**
   * Fires with the chosen value and the originating event. The event is a
   * generic `SyntheticEvent` (click or keydown) rather than a `ChangeEvent`:
   * a custom listbox selection has no native `change` event to forward.
   */
  onChange?: (value: string, event: SyntheticEvent) => void;
}

/** Multi-select: value is a string array of the selected option values. */
export interface SelectMultiProps extends SelectBaseProps {
  multiple: true;
  /** Controlled selected values. */
  value?: string[];
  /** Initial selected values when uncontrolled. */
  defaultValue?: string[];
  /** Fires with the full set of selected values and the originating event. */
  onChange?: (value: string[], event: SyntheticEvent) => void;
}

export type SelectProps = SelectSingleProps | SelectMultiProps;

/** Normalize a single/multi value (or form-binding value) to an array. */
function toArray(value: string | string[] | undefined): string[] {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

/** `ref` forwards to the trigger `<button>`, not the listbox panel. */
export const Select = /* @__PURE__ */ forwardRef<HTMLButtonElement, SelectProps>(
  function Select(props, ref) {
    // The public type is a single|multi union; internally we treat the selection
    // as an array and report the shape `multiple` implies. The cast bridges the
    // union's per-mode value/onChange to one internal handler.
    const {
      value,
      defaultValue,
      onChange,
      multiple = false,
      options,
      placeholder = 'Select…',
      label,
      disabled,
      error,
      required,
      helperText,
      errorText,
      size = 'md',
      density,
      clearable,
      clearLabel,
      className,
      id,
      ...rest
    } = props as SelectBaseProps & {
      multiple?: boolean;
      value?: string | string[];
      defaultValue?: string | string[];
      onChange?: (value: string | string[], event: SyntheticEvent) => void;
    };

    // When inside a <FormField>, defer label/required/aria to it; otherwise use own props.
    const field = useOptionalFieldContext();
    const messages = useMessages();
    const description = error ? errorText : helperText;
    const [selected, setSelected] = useControllableState<string | string[] | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as string | string[] | undefined) : selected;
    const selectedValues = toArray(currentValue);
    const labelOf = (val: string) => options.find((o) => o.value === val)?.label ?? val;
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const reactId = useId('select');
    const baseId = field?.id ?? id ?? reactId;
    // FormField owns the label/description in-context; Select renders its own only standalone.
    const showOwnLabel = !field;
    const describedBy = field
      ? field.describedById
      : description != null
        ? `${baseId}-desc`
        : undefined;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const labelId = `${baseId}-label`;
    // Accessible name for the trigger/listbox. In-context the FormField's <label>
    // can't target the role="button" trigger via htmlFor, so reference its labelId
    // with aria-labelledby; standalone, point at the own label span (+ trigger for
    // the selected/placeholder value).
    const triggerLabelledBy = field ? field.labelId : label ? `${labelId} ${baseId}` : undefined;
    const listLabelledBy = field ? field.labelId : label ? labelId : undefined;
    const listboxId = `${baseId}-listbox`;
    const optionId = (i: number) => `${baseId}-opt-${i}`;
    const listRef = useRef<HTMLUListElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    // Restore focus to the trigger only on keyboard-initiated closes (Escape /
    // selection), never on outside-pointer dismiss (don't yank focus away).
    const restoreFocus = useRef(false);

    const hasSelection = selectedValues.length > 0;
    const selectedOption = options.find((o) => o.value === selectedValues[0]);

    // Report the mode-appropriate shape: a bare string (single, `''` = none) or
    // the full array (multi).
    const commit = (nextValues: string[], event: SyntheticEvent) => {
      const reported: string | string[] = multiple ? nextValues : (nextValues[0] ?? '');
      if (bound) bound.onChange(reported, event);
      else setSelected(reported);
      onChange?.(reported, event);
    };

    const choose = (opt: SelectOption, event: SyntheticEvent) => {
      if (opt.disabled) return;
      if (multiple) {
        // Toggle membership and keep the listbox open + focused for further picks.
        const next = selectedValues.includes(opt.value)
          ? selectedValues.filter((v) => v !== opt.value)
          : [...selectedValues, opt.value];
        commit(next, event);
        listRef.current?.focus();
      } else {
        commit([opt.value], event);
        restoreFocus.current = true; // selection → return focus to the trigger
        setOpen(false);
      }
    };

    const removeValue = (val: string, event: SyntheticEvent) => {
      commit(
        selectedValues.filter((v) => v !== val),
        event,
      );
      triggerRef.current?.focus();
    };

    // Reset to "no selection". Reports '' (single) / [] (multi) so the value stays
    // the mode's shape for consumers; stopPropagation keeps the trigger's toggle
    // from firing, and focus returns to the trigger (the clear button is leaving).
    const clear = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      commit([], event);
      triggerRef.current?.focus();
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
          restoreFocus.current = true; // keyboard close → return focus to the trigger
          setOpen(false);
          break;
        default:
          break;
      }
    };

    // Open the listbox from the trigger via keyboard (WAI-ARIA listbox pattern).
    // ArrowDown/ArrowUp/Enter/Space all open; once open, the open effect seeds the
    // active option to the selected one (or first enabled), and onListKeyDown takes
    // over navigation. ArrowUp seeds to the last enabled option when nothing is set.
    // Multi-select: Backspace on the (closed) trigger removes the last chip, for
    // parity with Combobox's empty-input Backspace.
    const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (multiple && event.key === 'Backspace' && hasSelection) {
        event.preventDefault();
        removeValue(selectedValues[selectedValues.length - 1]!, event);
        return;
      }
      if (open) return; // when open, the listbox handles keys
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          event.preventDefault();
          openWith.current = event.key === 'ArrowUp' ? 'last' : 'first';
          setOpen(true);
          break;
        default:
          break;
      }
    };

    const wasOpen = useRef(false);
    // How the listbox was opened, controlling the seeded active option:
    // 'pointer' (default — seed the selected option, else nothing, preserving the
    // click-open behavior), 'first' (keyboard ArrowDown/Enter/Space), or 'last'
    // (keyboard ArrowUp). The open effect reads and resets this.
    const openWith = useRef<'pointer' | 'first' | 'last'>('pointer');

    // Focus the listbox when it opens (keyboard nav); seed the active index to the
    // currently selected option so arrow keys start from a sensible place.
    // On close, return focus to the trigger (Fix 1) unless this is the initial mount.
    // Fix 2: skip disabled options when seeding the active index.
    useEffect(() => {
      if (open) {
        listRef.current?.focus();
        // Prefer the (first) selected option; otherwise seed first/last enabled
        // based on how the listbox was opened (ArrowUp → last, anything else → first).
        let seed = options.findIndex((o) => selectedValues.includes(o.value) && !o.disabled);
        // No selection: keyboard-open seeds first/last enabled; pointer-open
        // leaves it unset (-1) so the first ArrowDown lands on the first option,
        // preserving the original click-then-arrow behavior.
        if (seed < 0 && openWith.current === 'last') {
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i]?.disabled) {
              seed = i;
              break;
            }
          }
        } else if (seed < 0 && openWith.current === 'first') {
          seed = options.findIndex((o) => !o.disabled);
        }
        setActiveIndex(seed);
        openWith.current = 'pointer';
      } else {
        setActiveIndex(-1);
        if (wasOpen.current && restoreFocus.current) triggerRef.current?.focus();
        restoreFocus.current = false;
      }
      wasOpen.current = open;
      // Intentionally keyed only on `open`: re-seeding on every options/selected
      // change would fight user navigation. Mirrors the Popover open/close effect.
    }, [open]);

    // Keep the active option visible during keyboard navigation. Without this,
    // ArrowDown/Up/Home/End past the visible window move aria-activedescendant to
    // an option the sighted user cannot see (WAI-ARIA listbox keyboard pattern).
    useEffect(() => {
      if (!open || activeIndex < 0) return;
      const el = document.getElementById(optionId(activeIndex));
      // scrollIntoView is unimplemented in jsdom; guard so unit tests don't throw.
      el?.scrollIntoView?.({ block: 'nearest' });
      // optionId derives from baseId only, which is stable for a given mount, so it
      // is intentionally not a dependency (this project does not run exhaustive-deps).
    }, [activeIndex, open]);

    // Shared trigger ARIA + handlers (single button and multi open-button alike).
    const triggerProps = {
      ...rest,
      ref: mergeRefs(triggerRef, ref),
      type: 'button' as const,
      id: baseId,
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': open,
      'aria-controls': open ? listboxId : undefined,
      'aria-labelledby': triggerLabelledBy,
      'aria-describedby': describedBy,
      disabled,
      onClick: composeEventHandlers(rest.onClick, () => setOpen((o) => !o)),
      onKeyDown: composeEventHandlers(rest.onKeyDown, onTriggerKeyDown),
    };

    const trigger = multiple ? (
      <div
        className={styles.multiControl}
        data-size={size}
        data-density={density}
        data-error={invalid ? 'true' : undefined}
        data-clearable={clearable && hasSelection ? 'true' : undefined}
      >
        {selectedValues.map((val) => (
          <Chip
            key={val}
            label={labelOf(val)}
            size="sm"
            onDelete={(e) => removeValue(val, e)}
            deleteLabel={messages.combobox.removeOption(labelOf(val))}
          />
        ))}
        <button {...triggerProps} className={styles.multiTrigger}>
          {hasSelection ? null : <span className={styles.placeholder}>{placeholder}</span>}
          <span aria-hidden>▾</span>
        </button>
      </div>
    ) : (
      <button
        {...triggerProps}
        className={styles.trigger}
        data-size={size}
        data-density={density}
        data-clearable={clearable && hasSelection ? 'true' : undefined}
        // data-error (not aria-invalid) drives the error border: aria-invalid is not
        // a valid attribute on the trigger's button role (axe aria-allowed-attr).
        // The error itself is conveyed to AT via aria-describedby. invalid is field-
        // aware, so the error state also shows when an enclosing FormField is invalid.
        data-error={invalid ? 'true' : undefined}
      >
        <span className={selectedOption ? undefined : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span aria-hidden>▾</span>
      </button>
    );

    return (
      <div className={cx(styles.root, className)} data-multiple={multiple ? 'true' : undefined}>
        {showOwnLabel && label != null ? (
          <span id={labelId} className={styles.label}>
            {label}
            {isRequired ? (
              <span className={styles.required} aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </span>
        ) : null}
        <div className={styles.control}>
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
              aria-multiselectable={multiple || undefined}
              data-density={density}
              tabIndex={-1}
              aria-labelledby={listLabelledBy}
              aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
              className={styles.listbox}
              onKeyDown={onListKeyDown}
            >
              {options.map((opt, i) => (
                <li
                  key={opt.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={selectedValues.includes(opt.value)}
                  aria-disabled={opt.disabled || undefined}
                  data-active={i === activeIndex ? 'true' : undefined}
                  data-selected={selectedValues.includes(opt.value) ? 'true' : undefined}
                  className={styles.option}
                  onClick={(e) => choose(opt, e)}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          </Popover>
          {clearable && hasSelection ? (
            <button
              type="button"
              className={styles.clear}
              aria-label={clearLabel ?? messages.clearSelection}
              onClick={clear}
            >
              <CloseIcon size={16} />
            </button>
          ) : null}
        </div>
        {showOwnLabel && description != null ? (
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
  },
);
