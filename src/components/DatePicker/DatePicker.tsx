import { forwardRef, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { Popover } from '../Popover';
import { Calendar } from '../Calendar';
import { TimePicker } from '../TimePicker';
import { useOptionalFieldContext } from '../FormField';
import { useLocale, useMessages } from '../../i18n';
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
  /**
   * Selection precision. `'day'` (default) picks a calendar day and truncates the
   * time. `'minute'` adds a time field to the popover and carries the full date +
   * time in `value`/`onChange`, honoring `min`/`max` at minute resolution.
   */
  granularity?: 'day' | 'minute';
  /** Time field: 12- or 24-hour display (only when `granularity='minute'`). Default 24. */
  hourCycle?: 12 | 24;
  /** Time field: show a seconds segment (only when `granularity='minute'`). */
  withSeconds?: boolean;
  /** Time field: minute step for arrow stepping (only when `granularity='minute'`). */
  minuteStep?: number;
  /** Earliest selectable date (inclusive; minute resolution when `granularity='minute'`). */
  min?: Date;
  /** Latest selectable date (inclusive; minute resolution when `granularity='minute'`). */
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

/** Combine a day's calendar fields with a time's hour/minute/second fields. */
function combineDateTime(day: Date, time: Date): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
  );
}

/** Clamp a full datetime into [min, max] (minute resolution). */
function clampDateTime(d: Date, min?: Date, max?: Date): Date {
  if (min && d.getTime() < min.getTime()) return new Date(min);
  if (max && d.getTime() > max.getTime()) return new Date(max);
  return d;
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
      granularity = 'day',
      hourCycle,
      withSeconds,
      minuteStep,
      placeholder: placeholderProp,
      size = 'md',
      disabled,
      error,
      required,
      label,
      locale: localeProp,
      triggerLabel: triggerLabelProp,
      className,
      id,
      ...rest
    },
    ref,
  ) {
    const messages = useMessages();
    const withTime = granularity === 'minute';
    const placeholder = placeholderProp ?? messages.datePicker.placeholder;
    const triggerLabel = triggerLabelProp ?? messages.datePicker.triggerLabel;
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
          ...(withTime
            ? {
                hour: 'numeric',
                minute: '2-digit',
                ...(withSeconds ? { second: '2-digit' } : null),
                hour12: hourCycle === 12,
              }
            : null),
        }).format(currentValue)
      : '';

    const commit = (next: Date) => {
      if (bound) bound.onChange(next);
      else setSelected(next);
      onChange?.(next);
    };

    const close = () => {
      setOpen(false);
      inputRef.current?.focus();
    };

    const choose = (date: Date) => {
      if (withTime) {
        // Keep the existing time-of-day (or midnight); honor min/max at minute
        // resolution; leave the popover open so the time field can be adjusted.
        const next = clampDateTime(
          combineDateTime(date, currentValue ?? startOfDay(date)),
          min,
          max,
        );
        commit(next);
      } else {
        commit(startOfDay(date));
        close();
      }
    };

    // Time field changed (granularity='minute'): merge the new time onto the
    // selected day (or today if none yet), clamped to [min, max].
    const chooseTime = (time: Date | null) => {
      if (!time) return;
      const day = currentValue ?? new Date();
      commit(clampDateTime(combineDateTime(day, time), min, max));
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
          aria-label={messages.datePicker.dialogLabel}
          trigger={trigger}
        >
          <div className={styles.popover}>
            <Calendar value={currentValue} onChange={choose} min={min} max={max} locale={locale} />
            {withTime ? (
              <div className={styles.timeRow}>
                <TimePicker
                  label={messages.datePicker.timeLabel}
                  value={currentValue}
                  onChange={chooseTime}
                  hourCycle={hourCycle}
                  withSeconds={withSeconds}
                  minuteStep={minuteStep}
                  locale={locale}
                  size={size}
                />
                <button type="button" className={styles.done} onClick={close}>
                  {messages.datePicker.done}
                </button>
              </div>
            ) : null}
          </div>
        </Popover>
      </div>
    );
  },
);
