import { forwardRef, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useControllableState, useId } from '../../primitives';
import { useOptionalFieldContext } from '../FormField';
import { useLocale, useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import styles from './TimePicker.module.css';

export type TimePickerSize = 'sm' | 'md' | 'lg';

export interface TimePickerProps {
  /** Controlled value; only the time-of-day (hours/minutes/seconds) is read. */
  value?: Date;
  /** Initial value when uncontrolled. */
  defaultValue?: Date;
  /** Fires with a Date carrying the chosen time, or `null` when fully cleared. */
  onChange?: (date: Date | null) => void;
  /** 12- or 24-hour display. Defaults to 24. */
  hourCycle?: 12 | 24;
  /** Show a seconds segment. Defaults to false. */
  withSeconds?: boolean;
  /** Step (minutes) applied when arrow-stepping the minute segment. Defaults to 1. */
  minuteStep?: number;
  /** Defaults to 'md'. */
  size?: TimePickerSize;
  /** Disables the control. */
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
  /** Hint shown below the control. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Message shown below the control when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** BCP 47 locale for the AM/PM names. */
  locale?: string;
  /** Class applied to the root wrapper. */
  className?: string;
  /** Base id for the control; label/description ids derive from it. */
  id?: string;
}

type Segment = 'hour' | 'minute' | 'second';
interface Parts {
  hour: number | null;
  minute: number | null;
  second: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const mod = (n: number, m: number) => ((n % m) + m) % m;

function partsFromDate(d: Date | undefined): Parts {
  if (!d) return { hour: null, minute: null, second: null };
  return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
}

/** Resolve the localized AM/PM names so 12-hour mode honors the locale. */
function dayPeriodNames(locale: string | undefined): { am: string; pm: string } {
  const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
  const read = (h: number) => {
    const part = fmt.formatToParts(new Date(2023, 0, 1, h)).find((p) => p.type === 'dayPeriod');
    return part?.value ?? (h < 12 ? 'AM' : 'PM');
  };
  return { am: read(6), pm: read(18) };
}

/** `ref` forwards to the root `role="group"` wrapper. */
export const TimePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, TimePickerProps>(
  function TimePicker(
    {
      value,
      defaultValue,
      onChange,
      hourCycle = 24,
      withSeconds = false,
      minuteStep = 1,
      size = 'md',
      disabled,
      error,
      required,
      label,
      helperText,
      errorText,
      locale: localeProp,
      className,
      id: idProp,
    },
    ref,
  ) {
    const messages = useMessages();
    const contextLocale = useLocale();
    const locale = localeProp ?? contextLocale;
    const reactId = useId('timepicker');
    const field = useOptionalFieldContext();

    const baseId = field?.id ?? idProp ?? reactId;
    const labelId = `${baseId}-label`;
    const descriptionId = `${baseId}-description`;
    const showOwnLabel = !field;
    const invalid = field ? field.invalid : Boolean(error);
    const isRequired = field ? field.required : Boolean(required);
    const description = error ? errorText : helperText;
    // role="group" can't carry aria-invalid/aria-required (axe aria-allowed-attr);
    // the error reaches AT via aria-describedby, like Select/DatePicker.
    const describedBy = field
      ? field.describedById
      : description != null
        ? descriptionId
        : undefined;

    const [selected, setSelected] = useControllableState<Date | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as Date | undefined) : selected;

    // Segment parts are the display source of truth (they hold transient partial
    // entry a Date can't represent). They re-sync whenever the external value
    // changes out of band.
    const [parts, setParts] = useState<Parts>(() => partsFromDate(currentValue));
    const lastSyncRef = useRef<number | undefined>(currentValue?.getTime());
    const extTime = currentValue?.getTime();
    if (extTime !== lastSyncRef.current) {
      lastSyncRef.current = extTime;
      setParts(partsFromDate(currentValue));
    }

    // Per-segment typing buffer; cleared when focus leaves the segment so each
    // segment accumulates at most two digits before auto-advancing.
    const bufferRef = useRef<{ seg: Segment; text: string } | null>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);
    const periodRef = useRef<HTMLDivElement>(null);

    const periods = dayPeriodNames(locale);
    const is12 = hourCycle === 12;

    const segOrder: Array<'hour' | 'minute' | 'second' | 'period'> = [
      'hour',
      'minute',
      ...(withSeconds ? (['second'] as const) : []),
      ...(is12 ? (['period'] as const) : []),
    ];
    const refFor = (seg: 'hour' | 'minute' | 'second' | 'period') =>
      seg === 'hour'
        ? hourRef
        : seg === 'minute'
          ? minuteRef
          : seg === 'second'
            ? secondRef
            : periodRef;

    const focusSeg = (seg: 'hour' | 'minute' | 'second' | 'period') => refFor(seg).current?.focus();

    const moveSeg = (from: 'hour' | 'minute' | 'second' | 'period', delta: number) => {
      const i = segOrder.indexOf(from);
      const next = segOrder[i + delta];
      if (next) focusSeg(next);
    };

    // Emit: build a Date from the parts (date component from the current value or
    // today) once hours+minutes (and seconds when shown) are all set; emit null
    // when every segment is empty.
    const emit = (next: Parts) => {
      const complete =
        next.hour != null && next.minute != null && (!withSeconds || next.second != null);
      const empty =
        next.hour == null && next.minute == null && (!withSeconds || next.second == null);
      let out: Date | null | undefined;
      if (complete) {
        const base = currentValue ?? new Date();
        out = new Date(
          base.getFullYear(),
          base.getMonth(),
          base.getDate(),
          next.hour!,
          next.minute!,
          withSeconds ? next.second! : 0,
        );
      } else if (empty) {
        out = null;
      } else {
        out = undefined; // partial: hold internal state, don't emit a Date yet
      }
      if (out !== undefined) {
        if (bound) bound.onChange(out);
        else setSelected(out ?? undefined);
        onChange?.(out);
      }
    };

    const update = (patch: Partial<Parts>) => {
      const next = { ...parts, ...patch };
      setParts(next);
      emit(next);
    };

    const maxFor = (seg: Segment): number => (seg === 'hour' ? (is12 ? 12 : 23) : 59);
    const minFor = (seg: Segment): number => (seg === 'hour' && is12 ? 1 : 0);

    // Canonical (0-23) hour ⇄ displayed 12-hour value, preserving AM/PM.
    const displayHour = (h: number | null): number | null =>
      h == null ? null : is12 ? (mod(h, 12) === 0 ? 12 : mod(h, 12)) : h;
    const isPm = parts.hour != null && parts.hour >= 12;
    const toCanonicalHour = (shown: number, pm: boolean): number => {
      if (!is12) return mod(shown, 24);
      const base = shown % 12; // 12 → 0
      return pm ? base + 12 : base;
    };

    const step = (seg: Segment | 'period', dir: 1 | -1) => {
      if (seg === 'period') {
        if (parts.hour == null) return;
        update({ hour: mod(parts.hour + 12, 24) });
        return;
      }
      const cur = parts[seg];
      if (seg === 'hour') {
        const start = cur ?? (dir === 1 ? -1 : 24);
        update({ hour: mod(start + dir, 24) });
        return;
      }
      if (seg === 'minute') {
        const start = cur ?? (dir === 1 ? -minuteStep : 60);
        update({ minute: mod(start + dir * minuteStep, 60) });
        return;
      }
      const start = cur ?? (dir === 1 ? -1 : 60);
      update({ second: mod(start + dir, 60) });
    };

    const typeDigit = (seg: Segment, digit: string) => {
      const prev = bufferRef.current?.seg === seg ? bufferRef.current.text : '';
      let text = (prev + digit).slice(-2);
      let num = parseInt(text, 10);
      const max = maxFor(seg);
      // If the two-digit accumulation overflows, restart from the new digit.
      if (num > max) {
        text = digit;
        num = parseInt(text, 10);
      }
      const min = minFor(seg);
      if (num < min) num = min;
      const canonical = seg === 'hour' && is12 ? toCanonicalHour(num === 0 ? 12 : num, isPm) : num;
      update({ [seg]: canonical } as Partial<Parts>);
      // Auto-advance once the segment is unambiguously full (two digits, or a
      // first digit that can't take a second without overflowing).
      const full = text.length === 2 || num * 10 > max;
      if (full) {
        bufferRef.current = null;
        moveSeg(seg, 1);
      } else {
        bufferRef.current = { seg, text };
      }
    };

    const clearSeg = (seg: Segment) => {
      bufferRef.current = null;
      update({ [seg]: null } as Partial<Parts>);
    };

    const onSegKeyDown =
      (seg: 'hour' | 'minute' | 'second' | 'period') => (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            step(seg, 1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            step(seg, -1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            moveSeg(seg, 1);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            moveSeg(seg, -1);
            break;
          case 'Backspace':
          case 'Delete':
            e.preventDefault();
            if (seg !== 'period') clearSeg(seg);
            break;
          default:
            if (seg === 'period') {
              const k = e.key.toLowerCase();
              if (k === 'a' && isPm && parts.hour != null) {
                e.preventDefault();
                update({ hour: mod(parts.hour, 12) });
              } else if (k === 'p' && !isPm && parts.hour != null) {
                e.preventDefault();
                update({ hour: mod(parts.hour, 12) + 12 });
              }
            } else if (/^[0-9]$/.test(e.key)) {
              e.preventDefault();
              typeDigit(seg, e.key);
            }
            break;
        }
      };

    const segValue = (seg: Segment): string => {
      const v = seg === 'hour' ? displayHour(parts.hour) : parts[seg];
      return v == null ? '––' : pad(v);
    };

    const segLabel: Record<'hour' | 'minute' | 'second' | 'period', string> = {
      hour: messages.timePicker.hour,
      minute: messages.timePicker.minute,
      second: messages.timePicker.second,
      period: messages.timePicker.dayPeriod,
    };

    const renderSpin = (seg: Segment) => {
      const shown = seg === 'hour' ? displayHour(parts.hour) : parts[seg];
      return (
        <div
          ref={refFor(seg)}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          className={styles.segment}
          data-empty={shown == null ? 'true' : undefined}
          aria-label={segLabel[seg]}
          aria-valuemin={minFor(seg)}
          aria-valuemax={maxFor(seg)}
          aria-valuenow={shown ?? undefined}
          aria-valuetext={shown == null ? messages.timePicker.empty : pad(shown)}
          aria-disabled={disabled || undefined}
          onKeyDown={onSegKeyDown(seg)}
          onFocus={() => {
            if (bufferRef.current?.seg !== seg) bufferRef.current = null;
          }}
        >
          {segValue(seg)}
        </div>
      );
    };

    const periodValue = parts.hour == null ? '––' : isPm ? periods.pm : periods.am;

    return (
      <div className={cx(styles.root, className)} data-size={size}>
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
          className={styles.control}
          data-error={invalid ? 'true' : undefined}
          data-disabled={disabled ? 'true' : undefined}
          aria-labelledby={
            field ? field.labelId : showOwnLabel && label != null ? labelId : undefined
          }
          aria-describedby={describedBy}
        >
          {renderSpin('hour')}
          <span className={styles.colon} aria-hidden>
            :
          </span>
          {renderSpin('minute')}
          {withSeconds ? (
            <>
              <span className={styles.colon} aria-hidden>
                :
              </span>
              {renderSpin('second')}
            </>
          ) : null}
          {is12 ? (
            <div
              ref={periodRef}
              role="spinbutton"
              tabIndex={disabled ? -1 : 0}
              className={cx(styles.segment, styles.period)}
              data-empty={parts.hour == null ? 'true' : undefined}
              aria-label={segLabel.period}
              aria-valuetext={parts.hour == null ? messages.timePicker.empty : periodValue}
              aria-disabled={disabled || undefined}
              onKeyDown={onSegKeyDown('period')}
            >
              {periodValue}
            </div>
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
