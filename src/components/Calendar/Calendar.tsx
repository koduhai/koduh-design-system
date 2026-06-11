import { forwardRef, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Calendar.module.css';

export interface CalendarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled selected date. */
  value?: Date;
  /** Initial selected date when uncontrolled. */
  defaultValue?: Date;
  /** Fires with the newly selected date. */
  onChange?: (date: Date) => void;
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

export const Calendar = /* @__PURE__ */ forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  { value, defaultValue, onChange, min, max, locale, className, ...props },
  ref,
) {
  const [selected, setSelected] = useControllableState<Date | undefined>({
    value,
    defaultValue,
    onChange: undefined,
  });

  const today = startOfDay(new Date());

  // The month currently displayed in the grid. Seeded from the selected value
  // (or today), tracked separately so paging the grid never mutates selection.
  const initialView = selected ?? today;
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  // Roving focus: the day-of-month (1-based) that holds tabIndex=0. Seeded to the
  // selected day if it's in the displayed month, else today if visible, else day 1.
  const seedFocusDay = (): number => {
    if (selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth) {
      return selected.getDate();
    }
    if (today.getFullYear() === viewYear && today.getMonth() === viewMonth) {
      return today.getDate();
    }
    return 1;
  };
  const [focusDay, setFocusDay] = useState<number>(seedFocusDay);

  const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // When a key handler changes the displayed month, defer focusing the new day
  // until after that render (the button doesn't exist yet on the current pass).
  const pendingFocus = useRef<number | null>(null);

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
    setSelected(date);
    onChange?.(date);
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

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.nav}
          aria-label="Previous month"
          onClick={() => goToMonth(-1)}
        >
          <span aria-hidden>‹</span>
        </button>
        <span className={styles.monthLabel} aria-live="polite">
          {monthLabel}
        </span>
        <button
          type="button"
          className={styles.nav}
          aria-label="Next month"
          onClick={() => goToMonth(1)}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      <div role="grid" aria-label={monthLabel} className={styles.grid}>
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
                const isSelected = selected ? isSameDay(date, selected) : false;
                const isToday = isSameDay(date, today);
                const disabled = !inRange(date, min, max);
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
                    data-today={isToday ? 'true' : undefined}
                    tabIndex={day === focusDay ? 0 : -1}
                    disabled={disabled}
                    onClick={() => choose(day)}
                    onKeyDown={(event) => handleKeyDown(event, day)}
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
});
