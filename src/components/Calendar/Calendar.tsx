import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useControllableState, useId } from '../../primitives';
import { useLocale, useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import styles from './Calendar.module.css';

/** A start/end date range. Either endpoint may be `null` while a range is being picked. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Earliest selectable date (inclusive). Days before this are disabled. */
  min?: Date;
  /** Latest selectable date (inclusive). Days after this are disabled. */
  max?: Date;
  /**
   * BCP 47 locale for month/weekday names. Defaults to the runtime default
   * (`undefined` → `Intl` picks the host locale).
   */
  locale?: string;
}

/** Single-date selection (default). */
export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: 'single';
  /** Controlled selected date. */
  value?: Date;
  /** Initial selected date when uncontrolled. */
  defaultValue?: Date;
  /** Fires with the newly selected date. */
  onChange?: (date: Date) => void;
}

/** Range selection: pick a start, then an end. */
export interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range';
  /** Controlled selected range. */
  value?: DateRange;
  /** Initial selected range when uncontrolled. */
  defaultValue?: DateRange;
  /** Fires whenever an endpoint changes (start-only ranges report `end: null`). */
  onChange?: (range: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/** Strip time-of-day so two dates compare equal when they're the same calendar day. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Clamp a day to [min, max] (by calendar day) — returns whether it's in range. */
function inRange(day: Date, min?: Date, max?: Date): boolean {
  const t = startOfDay(day).getTime();
  if (min && t < startOfDay(min).getTime()) return false;
  if (max && t > startOfDay(max).getTime()) return false;
  return true;
}

/** Number of days in the month containing `year`/`month` (0-indexed month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * First enabled (in-range) day-of-month at or after `preferred`, falling back to
 * the nearest enabled day before it. Keeps roving focus off disabled buttons when
 * paging into a month whose `preferred` day is clamped out by `min`/`max`. Returns
 * `preferred` (clamped to the month) when the month has no in-range day at all.
 */
function firstEnabledDay(
  year: number,
  month: number,
  preferred: number,
  min?: Date,
  max?: Date,
): number {
  const total = daysInMonth(year, month);
  const start = Math.min(Math.max(preferred, 1), total);
  for (let day = start; day <= total; day += 1) {
    if (inRange(new Date(year, month, day), min, max)) return day;
  }
  for (let day = start - 1; day >= 1; day -= 1) {
    if (inRange(new Date(year, month, day), min, max)) return day;
  }
  return start;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

export const Calendar = /* @__PURE__ */ forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    // The public type is a single|range union; internally we keep one selection
    // slot (a Date or a DateRange) and branch on `mode`. The cast bridges the
    // union's per-mode value/onChange to one internal handler.
    const {
      mode = 'single',
      value,
      defaultValue,
      onChange,
      min,
      max,
      locale: localeProp,
      className,
      ...rest
    } = props as CalendarBaseProps & {
      mode?: 'single' | 'range';
      value?: Date | DateRange;
      defaultValue?: Date | DateRange;
      onChange?: (value: Date | DateRange) => void;
    };
    const isRange = mode === 'range';

    // Fall back to the i18n-provider locale when no explicit prop is given; the prop
    // still wins. `undefined` lets `Intl` pick the host locale, preserving prior
    // behavior. useLocale() is called unconditionally (the ?? is on the value, not
    // the hook) to respect the rules of hooks.
    const contextLocale = useLocale();
    const locale = localeProp ?? contextLocale;
    const messages = useMessages();
    const [selected, setSelected] = useControllableState<Date | DateRange | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });

    const single = !isRange ? (selected as Date | undefined) : undefined;
    const range: DateRange = isRange
      ? ((selected as DateRange | undefined) ?? EMPTY_RANGE)
      : EMPTY_RANGE;

    const today = startOfDay(new Date());

    // The month currently displayed in the grid. Seeded from the selection (range
    // start, single value) or today, tracked separately so paging never mutates
    // selection.
    const initialView = (isRange ? range.start : single) ?? today;
    const [viewYear, setViewYear] = useState(initialView.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialView.getMonth());

    // Roving focus: the day-of-month (1-based) that holds tabIndex=0. Seeded to the
    // selected day if it's in the displayed month, else today if visible, else day 1.
    const seedFocusDay = (): number => {
      const anchor = isRange ? (range.start ?? range.end) : single;
      if (anchor && anchor.getFullYear() === viewYear && anchor.getMonth() === viewMonth) {
        return anchor.getDate();
      }
      if (today.getFullYear() === viewYear && today.getMonth() === viewMonth) {
        return today.getDate();
      }
      return 1;
    };
    const [focusDay, setFocusDay] = useState<number>(seedFocusDay);

    // Hover preview (range mode, pointer only): the day under the cursor while an
    // end is still being chosen, so the tentative span highlights before the click.
    const [hoverDay, setHoverDay] = useState<Date | null>(null);

    const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);
    // When a key handler changes the displayed month, defer focusing the new day
    // until after that render (the button doesn't exist yet on the current pass).
    const pendingFocus = useRef<number | null>(null);

    // When controlled, a parent updating `value` to a date in a different month
    // pages the displayed grid to it so the selected cell stays visible. We only
    // sync the controlled prop (not internal `selected`) to avoid fighting the
    // user's own paging in the uncontrolled case.
    const controlledAnchor = isRange
      ? ((value as DateRange | undefined)?.start ?? (value as DateRange | undefined)?.end)
      : (value as Date | undefined);
    useEffect(() => {
      if (!controlledAnchor) return;
      if (
        controlledAnchor.getFullYear() === viewYear &&
        controlledAnchor.getMonth() === viewMonth
      ) {
        return;
      }
      setViewYear(controlledAnchor.getFullYear());
      setViewMonth(controlledAnchor.getMonth());
      setFocusDay(controlledAnchor.getDate());
    }, [controlledAnchor, viewYear, viewMonth]);

    const labelId = useId('ku-cal-label');

    const monthLabel = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(viewYear, viewMonth, 1));

    // Weekday short names, ordered Sunday→Saturday to match the grid layout.
    const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const weekdayNames = Array.from({ length: 7 }, (_, i) =>
      // 2023-01-01 is a Sunday — a stable anchor for generating weekday names.
      weekdayFmt.format(new Date(2023, 0, 1 + i)),
    );

    const total = daysInMonth(viewYear, viewMonth);
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

    const setView = (year: number, month: number, nextFocusDay?: number) => {
      setViewYear(year);
      setViewMonth(month);
      // Land roving focus on the first enabled day so paging never parks focus (and
      // tabIndex=0) on a disabled, out-of-range button, which would lose focus.
      const focusTarget = firstEnabledDay(year, month, nextFocusDay ?? 1, min, max);
      setFocusDay(focusTarget);
      pendingFocus.current = focusTarget;
    };

    const goToMonth = (delta: number) => {
      const d = new Date(viewYear, viewMonth + delta, 1);
      setView(d.getFullYear(), d.getMonth());
    };

    const choose = (day: number) => {
      const date = new Date(viewYear, viewMonth, day);
      if (!inRange(date, min, max)) return;
      if (isRange) {
        const { start, end } = range;
        // Begin a fresh range when there's no start, or a complete range exists, or
        // the picked day falls before the pending start.
        const next: DateRange =
          !start || (start && end) || date.getTime() < startOfDay(start).getTime()
            ? { start: date, end: null }
            : { start, end: date };
        setSelected(next);
        (onChange as ((r: DateRange) => void) | undefined)?.(next);
        setHoverDay(null);
      } else {
        setSelected(date);
        (onChange as ((d: Date) => void) | undefined)?.(date);
      }
      setFocusDay(day);
    };

    /**
     * Move the roving focus by `delta` days, paging across month boundaries when
     * the target leaves the displayed month. Skips out-of-range days by clamping
     * focus into the [min, max] window (the target day itself may be disabled, but
     * we never let focus escape the bounds entirely).
     */
    const moveFocus = (delta: number) => {
      const target = new Date(viewYear, viewMonth, focusDay + delta);
      if (min && startOfDay(target).getTime() < startOfDay(min).getTime()) return;
      if (max && startOfDay(target).getTime() > startOfDay(max).getTime()) return;
      if (target.getFullYear() === viewYear && target.getMonth() === viewMonth) {
        setFocusDay(target.getDate());
        dayRefs.current[target.getDate()]?.focus();
      } else {
        setView(target.getFullYear(), target.getMonth(), target.getDate());
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: number) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveFocus(7);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveFocus(-7);
          break;
        case 'Home': {
          // Start of the current week (Sunday) within the displayed month.
          event.preventDefault();
          const weekday = new Date(viewYear, viewMonth, day).getDay();
          moveFocus(-weekday);
          break;
        }
        case 'End': {
          // End of the current week (Saturday) within the displayed month.
          event.preventDefault();
          const weekday = new Date(viewYear, viewMonth, day).getDay();
          moveFocus(6 - weekday);
          break;
        }
        case 'PageUp':
          event.preventDefault();
          goToMonth(-1);
          break;
        case 'PageDown':
          event.preventDefault();
          goToMonth(1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          choose(day);
          break;
        default:
          break;
      }
    };

    // After a month change driven by keyboard, focus the day we paged to.
    const attachDayRef = (day: number) => (node: HTMLButtonElement | null) => {
      dayRefs.current[day] = node;
      if (node && pendingFocus.current === day) {
        pendingFocus.current = null;
        node.focus();
      }
    };

    // Leading blank cells so day 1 lands under the correct weekday column.
    const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => i);
    const dayNumbers = Array.from({ length: total }, (_, i) => i + 1);

    // ARIA grid requires grid > row > gridcell, so chunk the cells into weeks of
    // 7 (padding the last week with trailing blanks) and wrap each in role="row".
    type Cell = { type: 'blank'; key: string } | { type: 'day'; day: number };
    const cells: Cell[] = [
      ...leadingBlanks.map((i): Cell => ({ type: 'blank', key: `lead-${i}` })),
      ...dayNumbers.map((day): Cell => ({ type: 'day', day })),
    ];
    while (cells.length % 7 !== 0) cells.push({ type: 'blank', key: `trail-${cells.length}` });
    const weeks: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    // Endpoint/in-range/preview classification for a day cell (range mode).
    const rangeStartT = range.start ? startOfDay(range.start).getTime() : null;
    const rangeEndT = range.end ? startOfDay(range.end).getTime() : null;
    const previewBounds = (): { lo: number; hi: number } | null => {
      if (!isRange || rangeStartT == null || rangeEndT != null || !hoverDay) return null;
      const h = startOfDay(hoverDay).getTime();
      return { lo: Math.min(rangeStartT, h), hi: Math.max(rangeStartT, h) };
    };
    const preview = previewBounds();

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        data-mode={isRange ? 'range' : undefined}
        {...rest}
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.nav}
            aria-label={messages.calendar.previousMonth}
            onClick={() => goToMonth(-1)}
          >
            <span aria-hidden>‹</span>
          </button>
          <span
            id={labelId}
            className={styles.monthLabel}
            role="heading"
            aria-level={2}
            aria-live="polite"
          >
            {monthLabel}
          </span>
          <button
            type="button"
            className={styles.nav}
            aria-label={messages.calendar.nextMonth}
            onClick={() => goToMonth(1)}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
        <div role="grid" aria-labelledby={labelId} className={styles.grid}>
          <div role="row" className={styles.weekdays}>
            {weekdayNames.map((name, i) => (
              <span key={i} role="columnheader" aria-label={name} className={styles.weekday}>
                {/* Abbreviate to the first 2 chars for a tidy column header. */}
                {name.slice(0, 2)}
              </span>
            ))}
          </div>
          <div role="rowgroup" className={styles.days}>
            {weeks.map((week, wi) => (
              <div role="row" key={`week-${wi}`} className={styles.week}>
                {week.map((cell) => {
                  if (cell.type === 'blank') {
                    return (
                      <span key={cell.key} role="gridcell" aria-hidden className={styles.blank} />
                    );
                  }
                  const { day } = cell;
                  const date = new Date(viewYear, viewMonth, day);
                  const dayT = startOfDay(date).getTime();
                  const isToday = isSameDay(date, today);
                  const disabled = !inRange(date, min, max);

                  let isSelected: boolean;
                  let isStart = false;
                  let isEnd = false;
                  let isInRange = false;
                  let isPreview = false;
                  if (isRange) {
                    isStart = rangeStartT != null && dayT === rangeStartT;
                    isEnd = rangeEndT != null && dayT === rangeEndT;
                    isInRange =
                      rangeStartT != null &&
                      rangeEndT != null &&
                      dayT >= rangeStartT &&
                      dayT <= rangeEndT;
                    isSelected = isStart || isEnd || isInRange;
                    isPreview = preview != null && dayT >= preview.lo && dayT <= preview.hi;
                  } else {
                    isSelected = single ? isSameDay(date, single) : false;
                  }
                  return (
                    <button
                      key={day}
                      ref={attachDayRef(day)}
                      type="button"
                      role="gridcell"
                      className={styles.day}
                      aria-selected={isSelected}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={new Intl.DateTimeFormat(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }).format(date)}
                      data-selected={isSelected ? 'true' : undefined}
                      data-range-start={isStart ? 'true' : undefined}
                      data-range-end={isEnd ? 'true' : undefined}
                      data-in-range={isInRange ? 'true' : undefined}
                      data-preview={isPreview ? 'true' : undefined}
                      data-today={isToday ? 'true' : undefined}
                      tabIndex={day === focusDay ? 0 : -1}
                      disabled={disabled}
                      onClick={() => choose(day)}
                      onKeyDown={(event) => handleKeyDown(event, day)}
                      onMouseEnter={() => {
                        if (isRange && !disabled && range.start && !range.end) setHoverDay(date);
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
