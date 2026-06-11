import { forwardRef, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SyntheticEvent } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import styles from './NumberField.module.css';

export type NumberFieldSize = 'sm' | 'md' | 'lg';

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  /**
   * Visible label, associated with the input via htmlFor/id. Provide `label`,
   * or wrap the control in a `<FormField>` which supplies it.
   */
  label?: ReactNode;
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Fires with the parsed value, or `null` when the field is empty. */
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
      onBlur,
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
    const field = useOptionalFieldContext();
    // When inside a <FormField>, defer label/required/aria to it; otherwise use own props.
    const id = field?.id ?? idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const description = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : description != null
        ? descriptionId
        : undefined;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field; // FormField renders the label when present

    const isControlled = value !== undefined;
    // Binding: when no explicit value prop is passed and a form binding exists, use form as source.
    const bound = value === undefined ? field?.binding : undefined;
    const boundNumeric = bound ? (bound.value as number | null) : undefined;

    // The external (bound or controlled) numeric source of truth, or `undefined`
    // when the field is uncontrolled and owns its own state.
    const externalNumeric = bound ? boundNumeric : isControlled ? value : undefined;

    // Raw-text buffer. It carries the exact characters the user typed so an
    // intermediate value like `1.` (or `1.50`) survives a render instead of being
    // snapped back to `String(parse(text))`. It syncs FROM the external value when
    // that value changes out of band (e.g. reset/programmatic set) but is NOT
    // overwritten while the user is editing a value that already parses to it.
    const [text, setText] = useState<string>(
      externalNumeric != null
        ? String(externalNumeric)
        : defaultValue != null
          ? String(defaultValue)
          : '',
    );
    // Track the last external value we synced from so we only re-seed the buffer
    // when the external value actually changes (not on every render).
    const lastExternalRef = useRef<number | null | undefined>(externalNumeric);
    if (externalNumeric !== undefined && externalNumeric !== lastExternalRef.current) {
      lastExternalRef.current = externalNumeric;
      // Re-seed only when the external value no longer matches what the buffer
      // parses to, so an in-flight edit ('1.') isn't clobbered by its own echo.
      const buffered = parse(text);
      if (buffered !== externalNumeric) {
        setText(externalNumeric == null ? '' : String(externalNumeric));
      }
    }

    const display = text;

    const clamp = (n: number) => {
      let r = n;
      if (min != null) r = Math.max(min, r);
      if (max != null) r = Math.min(max, r);
      return r;
    };
    const commit = (next: string, event?: SyntheticEvent) => {
      const parsed = parse(next);
      // Always keep the raw buffer in sync so intermediate text (e.g. '1.') shows
      // through; the parsed number is what we report upstream.
      setText(next);
      lastExternalRef.current = parsed;
      if (bound) bound.onChange(parsed, event);
      onChange?.(parsed, event);
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
        data-error={invalid ? 'true' : undefined}
      >
        {showOwnLabel && label != null ? (
          <label className={styles.label} htmlFor={id}>
            {label}
            {isRequired ? (
              <span className={styles.required} aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </label>
        ) : null}
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
            // Deliberately a text input, not type="number". Browsers sanitize the
            // value of a number input, coercing an in-progress string like '1.' or
            // '1.5e' to '', which destroys the raw-text buffer this component is
            // built around. inputMode="decimal" still surfaces a numeric keypad on
            // mobile. (min/max/step are number-input attributes, inert here;
            // clamping is enforced in JS via clamp()/adjust().)
            inputMode="decimal"
            type="text"
            value={display}
            required={isRequired}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => commit(e.target.value, e)}
            onBlur={(e) => {
              bound?.onBlur();
              onBlur?.(e);
            }}
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
        {showOwnLabel && description != null ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
