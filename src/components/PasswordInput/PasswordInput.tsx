import { forwardRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import { EyeIcon, EyeOffIcon } from '../../icons';
import styles from './PasswordInput.module.css';

export type PasswordInputSize = 'sm' | 'md' | 'lg';

/** Field density. Mirrors the `[data-density]` token mechanism (`--ku-density-*`). */
export type Density = 'comfortable' | 'compact';

export interface PasswordInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'size' | 'value' | 'defaultValue' | 'onChange' | 'type'
  > {
  /** Visible label, associated with the input. Or wrap in a `<FormField>`. */
  label?: ReactNode;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: PasswordInputSize;
  /** Field density; omit to inherit a `data-density` ancestor. */
  density?: Density;
}

export const PasswordInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      value,
      defaultValue,
      onChange,
      onBlur,
      helperText,
      error = false,
      errorText,
      size = 'md',
      density,
      required,
      disabled,
      className,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const reactId = useId('password');
    const field = useOptionalFieldContext();
    const id = field?.id ?? idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const ownDescription = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : ownDescription != null
        ? descriptionId
        : undefined;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field;

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? ((bound.value as string) ?? '') : state;

    const [visible, setVisible] = useState(false);

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-density={density}
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
          <input
            ref={ref}
            id={id}
            className={styles.input}
            type={visible ? 'text' : 'password'}
            value={currentValue}
            required={isRequired}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => {
              const next = event.target.value;
              if (bound) bound.onChange(next, event);
              else setState(next);
              onChange?.(next, event);
            }}
            onBlur={(e) => {
              bound?.onBlur();
              onBlur?.(e);
            }}
            {...props}
          />
          <button
            type="button"
            className={styles.toggle}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>
        {showOwnLabel && ownDescription ? (
          <p id={descriptionId} className={styles.description}>
            {ownDescription}
          </p>
        ) : null}
      </div>
    );
  },
);
