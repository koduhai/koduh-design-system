import { forwardRef, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { Popover } from '../Popover';
import { Calendar } from '../Calendar';
import type { DateRange } from '../Calendar';
import { useOptionalFieldContext } from '../FormField';
import { useLocale, useMessages } from '../../i18n';
import { useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './DateRangePicker.module.css';

export type DateRangePickerSize = 'sm' | 'md' | 'lg';

export interface DateRangePickerProps {
  /** Controlled selected range. */
  value?: DateRange;
  /** Initial selected range when uncontrolled. */
  defaultValue?: DateRange;
  /** Fires whenever an endpoint changes (start-only ranges report `end: null`). */
  onChange?: (range: DateRange) => void;
  /** Earliest selectable date (inclusive). */
  min?: Date;
  /** Latest selectable date (inclusive). */
  max?: Date;
  /** Defaults to 'md'. */
  size?: DateRangePickerSize;
  /** Disables the inputs and trigger. */
  disabled?: boolean;
  /** Puts the control in the error state. */
  error?: boolean;
  /** Marks the field required. */
  required?: boolean;
  /**
   * Visible label. Omit it (and wrap the control in a `<FormField>`) to defer the
   * label and aria wiring to the field.
   */
  label?: ReactNode;
  /** Placeholder for the start field. Defaults to `dateRangePicker.startPlaceholder`. */
  startPlaceholder?: string;
  /** Placeholder for the end field. Defaults to `dateRangePicker.endPlaceholder`. */
  endPlaceholder?: string;
  /** Accessible name for the start field. Defaults to `dateRangePicker.startLabel`. */
  startLabel?: string;
  /** Accessible name for the end field. Defaults to `dateRangePicker.endLabel`. */
  endLabel?: string;
  /** BCP 47 locale for the formatted values and the calendar. */
  locale?: string;
  /** Accessible label for the calendar trigger button. Defaults to `datePicker.triggerLabel`. */
  triggerLabel?: string;
  /** Class applied to the root wrapper. */
  className?: string;
  /** Base id for the control; label/calendar ids derive from it. */
  id?: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `ref` forwards to the root `role="group"` wrapper. */
export const DateRangePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      value,
      defaultValue,
      onChange,
      min,
      max,
      size = 'md',
      disabled,
      error,
      required,
      label,
      startPlaceholder: startPlaceholderProp,
      endPlaceholder: endPlaceholderProp,
      startLabel: startLabelProp,
      endLabel: endLabelProp,
      locale: localeProp,
      triggerLabel: triggerLabelProp,
      className,
      id,
    },
    ref,
  ) {
    const messages = useMessages();
    const contextLocale = useLocale();
    const locale = localeProp ?? contextLocale;
    const startPlaceholder = startPlaceholderProp ?? messages.dateRangePicker.startPlaceholder;
    const endPlaceholder = endPlaceholderProp ?? messages.dateRangePicker.endPlaceholder;
    const startLabel = startLabelProp ?? messages.dateRangePicker.startLabel;
    const endLabel = endLabelProp ?? messages.dateRangePicker.endLabel;
    const triggerLabel = triggerLabelProp ?? messages.datePicker.triggerLabel;

    const [selected, setSelected] = useControllableState<DateRange | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const [open, setOpen] = useState(false);

    const reactId = useId('daterangepicker');
    const field = useOptionalFieldContext();
    const bound = value === undefined ? field?.binding : undefined;
    const range: DateRange =
      (bound ? (bound.value as DateRange | undefined) : selected) ?? EMPTY_RANGE;

    const baseId = field?.id ?? id ?? reactId;
    const showOwnLabel = !field;
    const labelId = `${baseId}-label`;
    const calendarId = `${baseId}-calendar`;
    const invalid = field ? field.invalid : Boolean(error);
    const isRequired = field ? field.required : Boolean(required);
    // role="group" can't carry aria-invalid/aria-required (axe aria-allowed-attr);
    // the error reaches AT via aria-describedby, like DatePicker/TimePicker.
    const describedBy = field?.describedById;

    const startInputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const fmt = (d: Date | null) =>
      d
        ? new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(d)
        : '';

    const commit = (next: DateRange) => {
      if (bound) bound.onChange(next);
      else setSelected(next);
      onChange?.(next);
    };

    const choose = (next: DateRange) => {
      commit(next);
      // Close once a full range is chosen; keep open while only the start is set.
      if (next.start && next.end) {
        setOpen(false);
        startInputRef.current?.focus();
      }
    };

    const clear = () => {
      if (disabled) return;
      commit(EMPTY_RANGE);
    };

    const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && (range.start || range.end)) {
        e.preventDefault();
        clear();
      }
    };

    // Return focus to the start input when the popover closes via Esc or outside
    // click; defer so an outside pointerdown on another focusable settles first.
    const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) {
        queueMicrotask(() => {
          const active = document.activeElement;
          if (active == null || active === document.body || rootRef.current?.contains(active)) {
            startInputRef.current?.focus();
          }
        });
      }
    };

    // Keep min/max from selecting an end before the start when reported by the
    // Calendar; the Calendar already enforces start≤end, but guard the display.
    const orderedEnd =
      range.start &&
      range.end &&
      startOfDay(range.end).getTime() < startOfDay(range.start).getTime()
        ? null
        : range.end;

    const field_ = (
      <div className={styles.field} data-size={size} data-error={invalid ? 'true' : undefined}>
        <input
          ref={startInputRef}
          id={baseId}
          type="text"
          readOnly
          className={styles.input}
          value={fmt(range.start)}
          placeholder={startPlaceholder}
          aria-label={startLabel}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onInputKeyDown}
        />
        <span className={styles.separator} aria-hidden>
          –
        </span>
        <input
          type="text"
          readOnly
          className={styles.input}
          value={fmt(orderedEnd)}
          placeholder={endPlaceholder}
          aria-label={endLabel}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onInputKeyDown}
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
          ref={ref}
          role="group"
          aria-labelledby={
            field ? field.labelId : showOwnLabel && label != null ? labelId : undefined
          }
          aria-describedby={describedBy}
        >
          <Popover
            open={open}
            onOpenChange={handleOpenChange}
            placement="bottom-start"
            role="dialog"
            id={calendarId}
            aria-label={messages.dateRangePicker.dialogLabel}
            trigger={field_}
          >
            <div className={styles.popover}>
              <Calendar
                mode="range"
                value={range}
                onChange={choose}
                min={min}
                max={max}
                locale={locale}
              />
            </div>
          </Popover>
        </div>
      </div>
    );
  },
);
