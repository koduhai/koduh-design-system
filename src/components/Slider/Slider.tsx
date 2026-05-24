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
import styles from './Slider.module.css';

export type SliderSize = 'sm' | 'md';

export interface SliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  label: ReactNode;
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
  const id = idProp ?? reactId;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const description = error ? errorText : helperText;
  const trackRef = useRef<HTMLDivElement>(null);
  const [val, setVal] = useControllableState<number>({
    value,
    defaultValue: defaultValue ?? min,
  });
  const clampSnap = (n: number) => {
    const stepped = Math.round((n - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  };
  const set = (n: number, event?: SyntheticEvent) => {
    const clamped = clampSnap(n);
    setVal(clamped);
    onChange?.(clamped, event);
  };
  const pct = ((val - min) / (max - min)) * 100;

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
        next = rtl ? val - step : val + step;
        break;
      case 'ArrowUp':
        next = val + step;
        break;
      case 'ArrowLeft':
        next = rtl ? val + step : val - step;
        break;
      case 'ArrowDown':
        next = val - step;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      case 'PageUp':
        next = val + step * 10;
        break;
      case 'PageDown':
        next = val - step * 10;
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

  return (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      data-size={size}
      data-disabled={disabled ? 'true' : undefined}
      data-error={error ? 'true' : undefined}
      {...rest}
    >
      <span id={labelId} className={styles.label}>
        {label}
        {formatValue ? ` — ${formatValue(val)}` : ''}
      </span>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          if (!disabled) {
            pointerFromClientX(e.clientX, e);
          }
        }}
        style={{ ['--slider-pct']: `${pct}%` } as CSSProperties}
      >
        <div className={styles.fill} />
        <div
          className={styles.thumb}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={val}
          aria-valuetext={formatValue ? formatValue(val) : undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={error || undefined}
          aria-describedby={description != null ? descriptionId : undefined}
          onKeyDown={disabled ? undefined : onKeyDown}
          onBlur={onBlur}
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
