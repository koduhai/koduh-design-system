import { forwardRef, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useMessages } from '../../i18n';
import { useOptionalFieldContext } from '../FormField';
import styles from './Rating.module.css';

export type RatingSize = 'sm' | 'md' | 'lg';

export interface RatingProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'role'
> {
  /** Controlled rating value (0..max). */
  value?: number;
  /** Initial value when uncontrolled. Defaults to 0. */
  defaultValue?: number;
  /** Fires with the newly selected rating. */
  onChange?: (value: number) => void;
  /** Number of stars. Defaults to 5. */
  max?: number;
  /** Renders a non-interactive display of the value. */
  readOnly?: boolean;
  /** Star size. Defaults to 'md'. */
  size?: RatingSize;
  /** Accessible name for the rating group. */
  'aria-label'?: string;
}

// Filled vs outline star — two distinct shapes so the signal is never color-only.
const FilledStar = (): ReactNode => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden
    focusable="false"
  >
    <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const OutlineStar = (): ReactNode => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden
    focusable="false"
  >
    <path d="m22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.45 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28z" />
  </svg>
);

export const Rating = /* @__PURE__ */ forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value,
    defaultValue,
    onChange,
    max = 5,
    readOnly = false,
    size = 'md',
    className,
    'aria-label': ariaLabel = 'Rating',
    ...props
  },
  ref,
) {
  const baseId = useId('rating');
  const messages = useMessages();
  const field = useOptionalFieldContext();
  const starRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [state, setState] = useControllableState<number>({
    value,
    defaultValue: defaultValue ?? 0,
    onChange: undefined,
  });

  // Bind to an enclosing <Form> only when the consumer didn't pass a controlled
  // `value`. Rating value semantics = number.
  const bound = value === undefined ? field?.binding : undefined;
  const selected = bound ? Number(bound.value ?? 0) : state;

  const select = (next: number) => {
    if (readOnly) return;
    if (bound) bound.onChange(next);
    else setState(next);
    onChange?.(next);
  };

  // The radio at `index` (1..max). Roving focus: only one star is tabbable.
  // The tabbable star is the selected one, or the first when nothing is selected.
  const focusableRating = selected >= 1 && selected <= max ? selected : 1;

  const focusStar = (rating: number) => {
    const clamped = Math.min(Math.max(rating, 1), max);
    starRefs.current[clamped - 1]?.focus();
    // Clearing is intentionally unsupported (no zero/toggle contract), so a
    // boundary key press that does not move the value (e.g. ArrowLeft on star 1
    // when 1 is already selected, or ArrowRight on a maxed rating) is a no-op:
    // moving focus is fine, but we don't re-fire select/onChange redundantly.
    if (clamped !== selected) select(clamped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, rating: number) => {
    if (readOnly) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        focusStar(rating + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        focusStar(rating - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusStar(1);
        break;
      case 'End':
        event.preventDefault();
        focusStar(max);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={ref}
      id={field?.id}
      className={cx(styles.root, className)}
      role="radiogroup"
      aria-label={field ? undefined : ariaLabel}
      aria-labelledby={field?.labelId}
      aria-describedby={field?.describedById}
      aria-invalid={field?.invalid || undefined}
      aria-required={field?.required || undefined}
      aria-readonly={readOnly || undefined}
      data-size={size}
      data-readonly={readOnly ? 'true' : undefined}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => {
        const rating = i + 1;
        const filled = rating <= selected;
        const checked = rating === selected;
        return (
          <div
            key={rating}
            ref={(node) => {
              starRefs.current[i] = node;
            }}
            role="radio"
            id={`${baseId}-star-${rating}`}
            className={styles.star}
            aria-label={messages.rating.starLabel(rating)}
            aria-checked={checked}
            data-filled={filled ? 'true' : undefined}
            // Roving tabindex: readOnly group is not in the tab order at all.
            tabIndex={readOnly ? -1 : rating === focusableRating ? 0 : -1}
            onClick={() => select(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
          >
            {filled ? <FilledStar /> : <OutlineStar />}
          </div>
        );
      })}
    </div>
  );
});
