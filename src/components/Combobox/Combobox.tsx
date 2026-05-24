import { forwardRef, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import { Popover } from '../Popover';
import { useControllableState, useId, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
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

export interface ComboboxProps {
  /** Visible label, associated with the input via aria-labelledby. */
  label: ReactNode;
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
  /** Shown in the listbox when no option matches. Defaults to 'No results'. */
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
      noResultsText = 'No results',
      size = 'md',
      required,
      error = false,
      helperText,
      errorText,
      id: idProp,
      className,
    },
    ref,
  ) {
    const reactId = useId('combobox');
    const id = idProp ?? reactId;
    const labelId = `${id}-label`;
    const listboxId = `${id}-listbox`;
    const descriptionId = `${id}-description`;
    const optionId = (i: number) => `${id}-opt-${i}`;
    const description = error ? errorText : helperText;
    const inputRef = useRef<HTMLInputElement>(null);

    const [selected, setSelected] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const selectedOption = options.find((o) => o.value === selected);
    const [query, setQuery] = useState<string>(selectedOption?.label ?? '');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const filtered =
      query.trim() === '' && !open ? options : options.filter((o) => filter(o, query));

    const choose = (opt: ComboboxOption, event: SyntheticEvent) => {
      if (opt.disabled) return;
      setSelected(opt.value);
      setQuery(opt.label);
      onChange?.(opt.value, event);
      setOpen(false);
      setActiveIndex(-1);
    };

    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) setOpen(true);
          setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(0, i - 1));
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
          break;
        default:
          break;
      }
    };

    const input = (
      <input
        ref={mergeRefs(inputRef, ref)}
        id={id}
        role="combobox"
        type="text"
        className={styles.input}
        value={query}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-labelledby={labelId}
        aria-invalid={error || undefined}
        aria-describedby={description != null ? descriptionId : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
      />
    );

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-error={error ? 'true' : undefined}
      >
        <span id={labelId} className={styles.label}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </span>
        <div className={styles.control}>
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom-start"
            role="presentation"
            trigger={input}
          >
            <ul id={listboxId} role="listbox" className={styles.listbox} aria-labelledby={labelId}>
              {filtered.length === 0 ? (
                <li className={styles.noResults} role="presentation">
                  {noResultsText}
                </li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={opt.value === selected}
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
        </div>
        {description != null ? (
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
