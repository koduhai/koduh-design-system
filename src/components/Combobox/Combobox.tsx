import { forwardRef, useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import { Popover } from '../Popover';
import { useOptionalFieldContext } from '../FormField';
import { CloseIcon } from '../../icons';
import {
  composeEventHandlers,
  useAnnouncer,
  useControllableState,
  useId,
  mergeRefs,
} from '../../primitives';
import { cx } from '../../utils/cx';
import { useMessages } from '../../i18n';
import styles from './Combobox.module.css';

export type ComboboxSize = 'sm' | 'md' | 'lg';

export interface ComboboxOption {
  /** Value reported on selection. */
  value: string;
  /** Visible option text; also shown in the input once selected. */
  label: string;
  /** Renders the option non-selectable. */
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> {
  /**
   * Visible label, associated with the input via aria-labelledby. Optional when
   * the control is wrapped in a `<FormField>`, which supplies the label.
   */
  label?: ReactNode;
  /** The selectable options, in order. */
  options: ComboboxOption[];
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Fires with the chosen value and the originating event. */
  onChange?: (value: string, event: SyntheticEvent) => void;
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Match predicate. Defaults to case-insensitive label `includes`. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /**
   * Shown in the listbox when no option matches. Defaults to the i18n catalog's
   * `combobox.noResults` ('No results').
   */
  noResultsText?: ReactNode;
  /** Defaults to 'md'. */
  size?: ComboboxSize;
  /** Marks the field required: shows the indicator and sets the input required. */
  required?: boolean;
  /** Puts the control in the error state (aria-invalid). */
  error?: boolean;
  /** Hint shown below the control. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Message shown below the control when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /**
   * Shows a clear affordance when a value is selected. Clearing resets the
   * value and fires `onChange('', event)` — `''` is the "no selection" signal.
   */
  clearable?: boolean;
  /**
   * Accessible label for the clear button. Defaults to the i18n catalog's
   * `clearSelection` ('Clear selection').
   */
  clearLabel?: string;
  /** Base id for the control; ids for label/listbox/description derive from it. */
  id?: string;
  /** Class applied to the root wrapper. */
  className?: string;
}

const defaultFilter = (o: ComboboxOption, q: string) =>
  o.label.toLowerCase().includes(q.toLowerCase());

/** `ref` forwards to the editable `<input role="combobox">`. */
export const Combobox = /* @__PURE__ */ forwardRef<HTMLInputElement, ComboboxProps>(
  function Combobox(
    {
      label,
      options,
      value,
      defaultValue,
      onChange,
      placeholder,
      filter = defaultFilter,
      noResultsText,
      size = 'md',
      required,
      error = false,
      helperText,
      errorText,
      clearable,
      clearLabel,
      id: idProp,
      className,
      ...rest
    },
    ref,
  ) {
    const messages = useMessages();
    const reactId = useId('combobox');
    const field = useOptionalFieldContext();
    // Inside a <FormField>, defer label/required/aria to it; otherwise use own props.
    const id = field?.id ?? idProp ?? reactId;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field; // FormField renders the label when present
    const labelId = `${id}-label`;
    const listboxId = `${id}-listbox`;
    const descriptionId = `${id}-description`;
    const optionId = (i: number) => `${id}-opt-${i}`;
    const description = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : description != null
        ? descriptionId
        : undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    const [selected, setSelected] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as string | undefined) : selected;
    const selectedOption = options.find((o) => o.value === currentValue);
    const [query, setQuery] = useState<string>(selectedOption?.label ?? '');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Re-sync the visible query text when the selected value changes out of band
    // (e.g. a form reset() or a programmatic value change) rather than via the
    // input/option handlers, which already set `query` themselves. We don't touch
    // `query` while the user is typing because `currentValue` only changes on an
    // actual selection. Tracking the last-seen value lets us re-derive the label.
    // We also re-derive when the value is unchanged but its label only resolves
    // now (options arrived async after the value was set): in that case the query
    // is still the empty placeholder, so adopting the resolved label is safe and
    // does not clobber user typing.
    const lastValueRef = useRef<string | undefined>(currentValue);
    const lastLabelResolvedRef = useRef<boolean>(selectedOption != null);
    const valueChanged = currentValue !== lastValueRef.current;
    const labelJustResolved =
      !lastLabelResolvedRef.current && selectedOption != null && query === '';
    if (valueChanged || labelJustResolved) {
      lastValueRef.current = currentValue;
      lastLabelResolvedRef.current = selectedOption != null;
      const nextLabel = selectedOption?.label ?? '';
      if (nextLabel !== query) setQuery(nextLabel);
    }

    const filtered =
      query.trim() === '' && !open ? options : options.filter((o) => filter(o, query));

    // Announce the live result count while the listbox is open, so screen-reader
    // users hear how many options match as they type (imperative, fire-and-forget).
    const announce = useAnnouncer();
    useEffect(() => {
      if (!open) return;
      const n = filtered.length;
      announce(messages.combobox.resultCount(n));
    }, [filtered.length, open, announce, messages]);

    const choose = (opt: ComboboxOption, event: SyntheticEvent) => {
      if (opt.disabled) return;
      if (bound) bound.onChange(opt.value, event);
      else setSelected(opt.value);
      setQuery(opt.label);
      onChange?.(opt.value, event);
      setOpen(false);
      setActiveIndex(-1);
    };

    // Reset to "no selection". Reports '' (not undefined) so the value stays a
    // string for consumers; refocus the input after clearing.
    const clear = (event: SyntheticEvent) => {
      if (bound) bound.onChange('', event);
      else setSelected(undefined);
      setQuery('');
      onChange?.('', event);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    };

    const lastIndex = filtered.length - 1;
    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) setOpen(true);
          // Opening (or no active option yet): start at the first option rather
          // than incrementing a stale index left over from a previous open.
          setActiveIndex((i) => (i < 0 ? (lastIndex < 0 ? -1 : 0) : Math.min(lastIndex, i + 1)));
          break;
        case 'ArrowUp':
          e.preventDefault();
          // ArrowUp opens the listbox and, with no active option yet, lands on
          // the last option, per the WAI-ARIA combobox keyboard pattern.
          if (!open) setOpen(true);
          setActiveIndex((i) => (i < 0 ? lastIndex : Math.max(0, i - 1)));
          break;
        case 'Enter': {
          if (open && activeIndex >= 0) {
            e.preventDefault();
            const opt = filtered[activeIndex];
            if (opt) choose(opt, e);
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          // Reset the highlight so a later reopen starts with no active option.
          setActiveIndex(-1);
          break;
        default:
          break;
      }
    };

    const input = (
      <input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        id={id}
        role="combobox"
        type="text"
        className={styles.input}
        value={query}
        placeholder={placeholder}
        required={isRequired}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-labelledby={showOwnLabel && label != null ? labelId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={composeEventHandlers(rest.onFocus, () => setOpen(true))}
        onKeyDown={composeEventHandlers(rest.onKeyDown, onInputKeyDown)}
      />
    );

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-error={invalid ? 'true' : undefined}
      >
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
        <div
          className={styles.control}
          data-clearable={clearable && currentValue ? 'true' : undefined}
        >
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom-start"
            role="presentation"
            trigger={input}
          >
            <ul
              id={listboxId}
              role="listbox"
              className={styles.listbox}
              aria-labelledby={showOwnLabel && label != null ? labelId : undefined}
            >
              {filtered.length === 0 ? (
                <li className={styles.noResults} role="presentation">
                  {noResultsText ?? messages.combobox.noResults}
                </li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={opt.value === currentValue}
                    aria-disabled={opt.disabled || undefined}
                    data-active={i === activeIndex ? 'true' : undefined}
                    className={styles.option}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => choose(opt, e)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </Popover>
          {clearable && currentValue ? (
            <button
              type="button"
              className={styles.clear}
              aria-label={clearLabel ?? messages.clearSelection}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
            >
              <CloseIcon size={16} />
            </button>
          ) : null}
        </div>
        {showOwnLabel && description != null ? (
          <span
            id={descriptionId}
            className={styles.description}
            data-error={error ? 'true' : undefined}
          >
            {description}
          </span>
        ) : null}
      </div>
    );
  },
);
