import { forwardRef, useRef } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  SyntheticEvent,
} from 'react';
import { useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import styles from './Slider.module.css';

export type SliderSize = 'sm' | 'md';

export interface SliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /**
   * Visible label, rendered as a `<span>` referenced by aria-labelledby. Required
   * standalone; optional (and not rendered) inside a `<FormField>`, which supplies it.
   */
  label?: ReactNode;
  value?: number;
  defaultValue?: number;
  /** Fires with the new value and the originating keyboard/pointer event. */
  onChange?: (value: number, event?: SyntheticEvent) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  disabled?: boolean;
  /** Produces aria-valuetext (and any visible value readout). */
  formatValue?: (value: number) => string;
  /** Hint shown below the track. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the slider in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the track when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  id?: string;
}

export const Slider = /* @__PURE__ */ forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    label,
    value,
    defaultValue,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    size = 'md',
    disabled = false,
    formatValue,
    helperText,
    error = false,
    errorText,
    id: idProp,
    className,
    onBlur,
    onFocus,
    ...rest
  },
  ref,
) {
  const reactId = useId('slider');
  const field = useOptionalFieldContext();
  // Inside a <FormField>, defer id/label/aria to it; otherwise use own props.
  const id = field?.id ?? idProp ?? reactId;
  const ownLabelId = `${id}-label`;
  const labelId = field ? field.labelId : ownLabelId;
  const descriptionId = `${id}-description`;
  const ownDescription = error ? errorText : helperText;
  const description = field ? undefined : ownDescription;
  const describedBy = field
    ? field.describedById
    : ownDescription != null
      ? descriptionId
      : undefined;
  const invalid = field ? field.invalid : error;
  const showOwnLabel = !field; // FormField renders the label when present
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [val, setVal] = useControllableState<number>({
    value,
    defaultValue: defaultValue ?? min,
  });

  // Bind to an enclosing <Form> only when the consumer didn't pass a controlled
  // `value`. Slider value semantics = number.
  const bound = value === undefined ? field?.binding : undefined;
  const currentVal = bound ? Number(bound.value ?? min) : val;
  const clampSnap = (n: number) => {
    const stepped = Math.round((n - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  };
  const set = (n: number, event?: SyntheticEvent) => {
    const clamped = clampSnap(n);
    if (bound) bound.onChange(clamped, event);
    else setVal(clamped);
    onChange?.(clamped, event);
  };
  const pct = ((currentVal - min) / (max - min)) * 100;

  const isRtl = () =>
    typeof window !== 'undefined' && trackRef.current
      ? getComputedStyle(trackRef.current).direction === 'rtl'
      : false;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // In RTL the track increases toward the left, so the horizontal arrows swap
    // (vertical arrows and Home/End are unaffected). Matches the WAI-ARIA pattern.
    const rtl = isRtl();
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
        next = rtl ? currentVal - step : currentVal + step;
        break;
      case 'ArrowUp':
        next = currentVal + step;
        break;
      case 'ArrowLeft':
        next = rtl ? currentVal + step : currentVal - step;
        break;
      case 'ArrowDown':
        next = currentVal - step;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      case 'PageUp':
        next = currentVal + step * 10;
        break;
      case 'PageDown':
        next = currentVal - step * 10;
        break;
      default:
        return;
    }
    e.preventDefault();
    set(next, e);
  };

  const pointerFromClientX = (clientX: number, event?: SyntheticEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    // RTL: the start (max-distance) edge is the right, so measure from rect.right.
    const fraction = isRtl()
      ? (rect.right - clientX) / rect.width
      : (clientX - rect.left) / rect.width;
    set(min + fraction * (max - min), event);
  };

  // Pointer-drag: down on the track seeds the value and begins a drag; we capture
  // the pointer so subsequent moves keep tracking even if it leaves the track
  // bounds, until release. (setPointerCapture is a no-op/throws under jsdom, so
  // it's guarded.) Down also focuses the thumb so keyboard control follows a grab.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault(); // avoid text selection / native drag during the gesture
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* unsupported (jsdom) */
    }
    thumbRef.current?.focus();
    pointerFromClientX(e.clientX, e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pointerFromClientX(e.clientX, e);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* unsupported (jsdom) */
    }
  };

  return (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      data-size={size}
      data-disabled={disabled ? 'true' : undefined}
      data-error={invalid ? 'true' : undefined}
      {...rest}
    >
      {showOwnLabel ? (
        <span id={labelId} className={styles.label}>
          {label}
          {formatValue ? ` — ${formatValue(currentVal)}` : ''}
        </span>
      ) : null}
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ ['--slider-pct']: `${pct}%` } as CSSProperties}
      >
        <div className={styles.fill} />
        <div
          ref={thumbRef}
          id={id}
          className={styles.thumb}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentVal}
          aria-valuetext={formatValue ? formatValue(currentVal) : undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onKeyDown={disabled ? undefined : onKeyDown}
          onBlur={(e) => {
            bound?.onBlur();
            onBlur?.(e);
          }}
          onFocus={onFocus}
        />
      </div>
      {description != null ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}
    </div>
  );
});
