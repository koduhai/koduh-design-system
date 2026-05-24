import { forwardRef, useRef } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Slider.module.css';

export type SliderSize = 'sm' | 'md';

export interface SliderProps {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  disabled?: boolean;
  /** Produces aria-valuetext (and any visible value readout). */
  formatValue?: (value: number) => string;
  id?: string;
  className?: string;
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
    id: idProp,
    className,
  },
  ref,
) {
  const reactId = useId('slider');
  const id = idProp ?? reactId;
  const labelId = `${id}-label`;
  const trackRef = useRef<HTMLDivElement>(null);
  const [val, setVal] = useControllableState<number>({
    value,
    defaultValue: defaultValue ?? min,
    onChange,
  });
  const clampSnap = (n: number) => {
    const stepped = Math.round((n - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  };
  const set = (n: number) => setVal(clampSnap(n));
  const pct = ((val - min) / (max - min)) * 100;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = val + step;
        break;
      case 'ArrowLeft':
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
    set(next);
  };

  const pointerFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    set(min + ((clientX - rect.left) / rect.width) * (max - min));
  };

  return (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      data-size={size}
      data-disabled={disabled ? 'true' : undefined}
    >
      <span id={labelId} className={styles.label}>
        {label}
        {formatValue ? ` — ${formatValue(val)}` : ''}
      </span>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={(e) => {
          if (!disabled) {
            pointerFromClientX(e.clientX);
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
          onKeyDown={disabled ? undefined : onKeyDown}
        />
      </div>
    </div>
  );
});
