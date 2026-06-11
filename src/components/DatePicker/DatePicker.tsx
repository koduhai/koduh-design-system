import { forwardRef, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { Popover } from '../Popover';
import { Calendar } from '../Calendar';
import { useOptionalFieldContext } from '../FormField';
import { useLocale } from '../../i18n';
import { composeEventHandlers, mergeRefs, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './DatePicker.module.css';

export type DatePickerSize = 'sm' | 'md' | 'lg';

export interface DatePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'type' | 'min' | 'max'
> {
  /** Controlled selected date. */
  value?: Date;
  /** Initial selected date when uncontrolled. */
  defaultValue?: Date;
  /** Fires with the chosen date, or `null` when the field is cleared. */
  onChange?: (date: Date | null) => void;
  /** Earliest selectable date (inclusive). */
  min?: Date;
  /** Latest selectable date (inclusive). */
  max?: Date;
  /** Text shown when no date is selected. */
  placeholder?: string;
  /** Defaults to 'md'. */
  size?: DatePickerSize;
  /** Disables the input and trigger. */
  disabled?: boolean;
  /** Puts the control in the error state (aria-invalid). */
  error?: boolean;
  /** Marks the field required. */
  required?: boolean;
  /**
   * Visible label, associated via htmlFor/id. Omit it (and wrap the control in a
   * `<FormField>`) to defer the label and aria wiring to the field.
   */
  label?: ReactNode;
  /** BCP 47 locale for the formatted value and the calendar. */
  locale?: string;
  /** Accessible label for the calendar trigger button. Defaults to 'Open calendar'. */
  triggerLabel?: string;
  /** Class applied to the root wrapper. */
  className?: string;
  /** Base id for the control; the calendar/label ids derive from it. */
  id?: string;
}

/** Strip time so display + selection compare by calendar day. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `ref` forwards to the text `<input>`, not the trigger or calendar. */
export const DatePicker = /* @__PURE__ */ forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    {
      value,
      defaultValue,
      onChange,
      min,
      max,
      placeholder = 'Select a date…',
      size = 'md',
      disabled,
      error,
      required,
      label,
      locale: localeProp,
      triggerLabel = 'Open calendar',
      className,
      id,
      ...rest
    },
    ref,
  ) {
    const [selected, setSelected] = useControllableState<Date | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const [open, setOpen] = useState(false);

    // The `locale` prop still wins; the provider's configured locale is the
    // default when unset (both fall through to the Intl runtime default).
    const contextLocale = useLocale();
    const locale = localeProp ?? contextLocale;

    const reactId = useId('datepicker');
    const field = useOptionalFieldContext();
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as Date | undefined) : selected;
    // Inside a <FormField>, defer label/required/aria to it; otherwise use own props.
    const baseId = field?.id ?? id ?? reactId;
    const showOwnLabel = !field;
    const describedBy = field?.describedById;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const labelId = `${baseId}-label`;
    const calendarId = `${baseId}-calendar`;

    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const formatted = currentValue
      ? new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(currentValue)
      : '';

    const choose = (date: Date) => {
      const day = startOfDay(date);
      if (bound) bound.onChange(day);
      else setSelected(day);
      onChange?.(day);
      setOpen(false);
      inputRef.current?.focus();
    };

    // Clear the selection. The input is readOnly, so Backspace/Delete are the
    // affordance that emits the documented onChange(null) contract.
    const clear = () => {
      if (disabled) return;
      if (bound) bound.onChange(null);
      else setSelected(undefined);
      onChange?.(null);
    };

    const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && currentValue) {
        e.preventDefault();
        clear();
      }
    };

    // Return focus to the trigger input when the popover closes via Esc or an
    // outside click (Popover does no focus management; day selection handles its
    // own focus in `choose`). Defer to a microtask so an outside pointerdown that
    // lands on another focusable element settles first: reclaim focus only when it
    // is lost to the body or still sits inside this control (e.g. Esc with focus on
    // the trigger or in the calendar), not when the user moved to an external
    // focusable target.
    const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) {
        queueMicrotask(() => {
          const active = document.activeElement;
          if (active == null || active === document.body || rootRef.current?.contains(active)) {
            inputRef.current?.focus();
          }
        });
      }
    };

    const trigger = (
      <div className={styles.field} data-size={size} data-error={invalid ? 'true' : undefined}>
        <input
          {...rest}
          ref={mergeRefs(inputRef, ref)}
          id={baseId}
          type="text"
          readOnly
          className={styles.input}
          value={formatted}
          placeholder={placeholder}
          disabled={disabled}
          required={isRequired}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-labelledby={showOwnLabel && label ? labelId : undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={composeEventHandlers(rest.onKeyDown, handleInputKeyDown)}
        />
        <button
          type="button"
          className={styles.trigger}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? calendarId : undefined}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden>▦</span>
        </button>
      </div>
    );

    return (
      <div ref={rootRef} className={cx(styles.root, className)}>
        {showOwnLabel && label != null ? (
          <label id={labelId} className={styles.label} htmlFor={baseId}>
            {label}
            {isRequired ? (
              <span className={styles.required} aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <Popover
          open={open}
          onOpenChange={handleOpenChange}
          placement="bottom-start"
          role="dialog"
          id={calendarId}
          aria-label="Choose date"
          trigger={trigger}
        >
          <div className={styles.popover}>
            <Calendar value={currentValue} onChange={choose} min={min} max={max} locale={locale} />
          </div>
        </Popover>
      </div>
    );
  },
);
