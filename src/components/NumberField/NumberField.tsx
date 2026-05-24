import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SyntheticEvent } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './NumberField.module.css';

export type NumberFieldSize = 'sm' | 'md' | 'lg';

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  /** Visible label, associated with the input via htmlFor/id. */
  label: ReactNode;
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Fires with the parsed value (or null when empty) and the originating event. */
  onChange?: (value: number | null, event?: SyntheticEvent) => void;
  min?: number;
  max?: number;
  /** Increment for steppers/arrow keys. Defaults to 1. */
  step?: number;
  /** Defaults to 'md'. */
  size?: NumberFieldSize;
  required?: boolean;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
}

function parse(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export const NumberField = /* @__PURE__ */ forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      label,
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      size = 'md',
      required,
      error = false,
      helperText,
      errorText,
      className,
      id: idProp,
      disabled,
      ...props
    },
    ref,
  ) {
    const reactId = useId('numberfield');
    const id = idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const description = error ? errorText : helperText;

    const isControlled = value !== undefined;
    const [text, setText] = useState<string>(defaultValue != null ? String(defaultValue) : '');
    const display = isControlled ? (value == null ? '' : String(value)) : text;

    const clamp = (n: number) => {
      let r = n;
      if (min != null) r = Math.max(min, r);
      if (max != null) r = Math.min(max, r);
      return r;
    };
    const commit = (next: string, event?: SyntheticEvent) => {
      if (!isControlled) setText(next);
      onChange?.(parse(next), event);
    };
    const adjust = (delta: number, event: SyntheticEvent) => {
      const n = clamp((parse(display) ?? 0) + delta);
      commit(String(n), event);
    };
    const numeric = parse(display);
    const atMax = max != null && numeric != null && numeric >= max;
    const atMin = min != null && numeric != null && numeric <= min;

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-error={error ? 'true' : undefined}
      >
        <label className={styles.label} htmlFor={id}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </label>
        <div className={styles.field}>
          <button
            type="button"
            className={styles.step}
            aria-label="Decrement"
            disabled={disabled || atMin}
            onClick={(e) => adjust(-step, e)}
            tabIndex={-1}
          >
            −
          </button>
          <input
            ref={ref}
            id={id}
            className={styles.input}
            inputMode="numeric"
            type="number"
            value={display}
            min={min}
            max={max}
            step={step}
            required={required}
            disabled={disabled}
            aria-invalid={error || undefined}
            aria-describedby={description != null ? descriptionId : undefined}
            onChange={(e) => commit(e.target.value, e)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                adjust(step, e);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                adjust(-step, e);
              }
            }}
            {...props}
          />
          <button
            type="button"
            className={styles.step}
            aria-label="Increment"
            disabled={disabled || atMax}
            onClick={(e) => adjust(step, e)}
            tabIndex={-1}
          >
            +
          </button>
        </div>
        {description != null ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
