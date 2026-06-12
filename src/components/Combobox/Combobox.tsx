import { forwardRef, useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import { Popover } from '../Popover';
import { Chip } from '../Chip';
import { Spinner } from '../Spinner';
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
  /** Visible option text; also shown in the input once selected (single-select). */
  label: string;
  /** Renders the option non-selectable. */
  disabled?: boolean;
}

interface ComboboxBaseProps extends Omit<
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
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Match predicate. Defaults to case-insensitive label `includes`. Ignored when `onQueryChange` is set (options are then treated as already filtered server-side). */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Shown in the listbox when no option matches. Defaults to `combobox.noResults`. */
  noResultsText?: ReactNode;
  /** Show a loading affordance in the listbox (e.g. while async options load). */
  loading?: boolean;
  /** Text shown beside the loading spinner. Defaults to `combobox.loading`. */
  loadingText?: ReactNode;
  /**
   * Fires (debounced) with the current query text. Use to fetch options
   * server-side; providing it also disables client-side filtering (the supplied
   * `options` are shown as-is).
   */
  onQueryChange?: (query: string) => void;
  /** Debounce for `onQueryChange`, in ms. Default 200. */
  queryChangeDelay?: number;
  /** Allow creating a new option from the typed query. */
  creatable?: boolean;
  /** Called when the create entry is chosen, with the trimmed query. */
  onCreate?: (label: string, event: SyntheticEvent) => void;
  /** Label for the create entry. Defaults to `combobox.create` (`Add "{query}"`). */
  createLabel?: (query: string) => ReactNode;
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
  /** Shows a clear affordance when a value is selected. */
  clearable?: boolean;
  /** Accessible label for the clear button. Defaults to `clearSelection`. */
  clearLabel?: string;
  /** Base id for the control; ids for label/listbox/description derive from it. */
  id?: string;
  /** Class applied to the root wrapper. */
  className?: string;
}

/** Single-select (default): value is a string, `''` means no selection. */
export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: SyntheticEvent) => void;
}

/** Multi-select: value is a string array of the selected option values. */
export interface ComboboxMultiProps extends ComboboxBaseProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], event: SyntheticEvent) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

const defaultFilter = (o: ComboboxOption, q: string) =>
  o.label.toLowerCase().includes(q.toLowerCase());

/** Normalize a single/multi value (or form-binding value) to an array. */
function toArray(value: string | string[] | undefined): string[] {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

/** `ref` forwards to the editable `<input role="combobox">`. */
export const Combobox = /* @__PURE__ */ forwardRef<HTMLInputElement, ComboboxProps>(
  function Combobox(props, ref) {
    // The public type is a single|multi union; internally we treat the selection
    // as an array and report the shape `multiple` implies. The cast bridges the
    // union's per-mode value/onChange to one internal handler.
    const {
      label,
      options,
      multiple = false,
      value,
      defaultValue,
      onChange,
      placeholder,
      filter = defaultFilter,
      noResultsText,
      loading = false,
      loadingText,
      onQueryChange,
      queryChangeDelay = 200,
      creatable = false,
      onCreate,
      createLabel,
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
    } = props as ComboboxBaseProps & {
      multiple?: boolean;
      value?: string | string[];
      defaultValue?: string | string[];
      onChange?: (value: string | string[], event: SyntheticEvent) => void;
    };

    const messages = useMessages();
    const reactId = useId('combobox');
    const field = useOptionalFieldContext();
    const id = field?.id ?? idProp ?? reactId;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field;
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

    const [selected, setSelected] = useControllableState<string | string[] | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as string | string[] | undefined) : selected;
    const selectedValues = toArray(currentValue);
    const labelOf = (val: string) => options.find((o) => o.value === val)?.label ?? val;

    const [query, setQuery] = useState<string>(() =>
      multiple ? '' : (options.find((o) => o.value === selectedValues[0])?.label ?? ''),
    );
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Single-select only: re-sync the visible query text when the selected value
    // changes out of band (form reset / programmatic set), or when the label only
    // resolves now (options arrived async after the value was set). Multi-select's
    // input is a filter box, not a value display, so it is never re-synced.
    const single0 = multiple ? undefined : selectedValues[0];
    const single0Option = multiple ? undefined : options.find((o) => o.value === single0);
    const lastValueRef = useRef<string | undefined>(single0);
    const lastLabelResolvedRef = useRef<boolean>(single0Option != null);
    if (!multiple) {
      const valueChanged = single0 !== lastValueRef.current;
      const labelJustResolved =
        !lastLabelResolvedRef.current && single0Option != null && query === '';
      if (valueChanged || labelJustResolved) {
        lastValueRef.current = single0;
        lastLabelResolvedRef.current = single0Option != null;
        const nextLabel = single0Option?.label ?? '';
        if (nextLabel !== query) setQuery(nextLabel);
      }
    }

    // Server-side filtering: when onQueryChange is provided, options are already
    // filtered upstream, so show them as-is.
    const serverFiltering = onQueryChange != null;
    const filtered =
      serverFiltering || (query.trim() === '' && !open)
        ? options
        : options.filter((o) => filter(o, query));

    // Debounced query callback for async fetching.
    useEffect(() => {
      if (!onQueryChange) return;
      const handle = window.setTimeout(() => onQueryChange(query), queryChangeDelay);
      return () => window.clearTimeout(handle);
    }, [query, onQueryChange, queryChangeDelay]);

    // Whether to offer a "create" entry: creatable, a non-empty query, and no
    // existing option whose label matches the query exactly (case-insensitive).
    const trimmedQuery = query.trim();
    const showCreate =
      creatable &&
      trimmedQuery !== '' &&
      !options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());
    const createIndex = showCreate ? filtered.length : -1;

    // Announce the live result count while the listbox is open.
    const announce = useAnnouncer();
    useEffect(() => {
      if (!open || loading) return;
      announce(messages.combobox.resultCount(filtered.length));
    }, [filtered.length, open, loading, announce, messages]);

    const commit = (nextValues: string[], event: SyntheticEvent) => {
      const reported: string | string[] = multiple ? nextValues : (nextValues[0] ?? '');
      if (bound) bound.onChange(reported, event);
      else setSelected(reported);
      onChange?.(reported, event);
    };

    const choose = (opt: ComboboxOption, event: SyntheticEvent) => {
      if (opt.disabled) return;
      if (multiple) {
        const next = selectedValues.includes(opt.value)
          ? selectedValues.filter((v) => v !== opt.value)
          : [...selectedValues, opt.value];
        commit(next, event);
        setQuery('');
        setActiveIndex(-1);
        inputRef.current?.focus();
      } else {
        commit([opt.value], event);
        setQuery(opt.label);
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    const create = (event: SyntheticEvent) => {
      onCreate?.(trimmedQuery, event);
      if (multiple) setQuery('');
      setActiveIndex(-1);
      inputRef.current?.focus();
    };

    const removeValue = (val: string, event: SyntheticEvent) => {
      commit(
        selectedValues.filter((v) => v !== val),
        event,
      );
      inputRef.current?.focus();
    };

    const clear = (event: SyntheticEvent) => {
      commit([], event);
      setQuery('');
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    };

    const lastIndex = (showCreate ? filtered.length + 1 : filtered.length) - 1;
    const activateAt = (index: number, event: SyntheticEvent) => {
      if (index === createIndex) {
        create(event);
      } else {
        const opt = filtered[index];
        if (opt) choose(opt, event);
      }
    };

    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) setOpen(true);
          setActiveIndex((i) => (i < 0 ? (lastIndex < 0 ? -1 : 0) : Math.min(lastIndex, i + 1)));
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) setOpen(true);
          setActiveIndex((i) => (i < 0 ? lastIndex : Math.max(0, i - 1)));
          break;
        case 'Enter':
          if (open && activeIndex >= 0) {
            e.preventDefault();
            activateAt(activeIndex, e);
          }
          break;
        case 'Backspace':
          // Multi-select: Backspace on an empty input removes the last chip.
          if (multiple && query === '' && selectedValues.length > 0) {
            removeValue(selectedValues[selectedValues.length - 1]!, e);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
          break;
        default:
          break;
      }
    };

    const hasSelection = selectedValues.length > 0;

    const input = (
      <input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        id={id}
        role="combobox"
        type="text"
        className={styles.input}
        value={query}
        placeholder={multiple && hasSelection ? undefined : placeholder}
        required={isRequired && !hasSelection}
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
        data-multiple={multiple ? 'true' : undefined}
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
          data-clearable={clearable && hasSelection ? 'true' : undefined}
        >
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom-start"
            role="presentation"
            trigger={
              multiple ? (
                <div className={styles.multiControl}>
                  {selectedValues.map((val) => (
                    <Chip
                      key={val}
                      label={labelOf(val)}
                      size="sm"
                      onDelete={(e) => removeValue(val, e)}
                      deleteLabel={messages.combobox.removeOption(labelOf(val))}
                    />
                  ))}
                  {input}
                </div>
              ) : (
                input
              )
            }
          >
            <ul
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple || undefined}
              className={styles.listbox}
              aria-labelledby={showOwnLabel && label != null ? labelId : undefined}
            >
              {loading ? (
                <li className={styles.loading} role="presentation">
                  <Spinner size="sm" />
                  <span>{loadingText ?? messages.combobox.loading}</span>
                </li>
              ) : null}
              {!loading && filtered.length === 0 && !showCreate ? (
                <li className={styles.noResults} role="presentation">
                  {noResultsText ?? messages.combobox.noResults}
                </li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={selectedValues.includes(opt.value)}
                    aria-disabled={opt.disabled || undefined}
                    data-active={i === activeIndex ? 'true' : undefined}
                    data-selected={selectedValues.includes(opt.value) ? 'true' : undefined}
                    className={styles.option}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => choose(opt, e)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  >
                    {opt.label}
                  </li>
                ))
              )}
              {showCreate ? (
                <li
                  id={optionId(createIndex)}
                  role="option"
                  aria-selected={false}
                  data-active={createIndex === activeIndex ? 'true' : undefined}
                  className={styles.create}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={create}
                  onMouseEnter={() => setActiveIndex(createIndex)}
                >
                  {createLabel ? createLabel(trimmedQuery) : messages.combobox.create(trimmedQuery)}
                </li>
              ) : null}
            </ul>
          </Popover>
          {clearable && hasSelection ? (
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
