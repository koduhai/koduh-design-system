import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './TextField.module.css';

export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Visible label, associated with the input via htmlFor/id. */
  label: string;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: TextFieldSize;
  /** Content rendered inside the field, before the input (decorative). */
  startAdornment?: ReactNode;
  /** Content rendered inside the field, after the input (decorative). */
  endAdornment?: ReactNode;
}

export const TextField = /* @__PURE__ */ forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      value,
      defaultValue,
      onChange,
      helperText,
      error = false,
      errorText,
      size = 'md',
      startAdornment,
      endAdornment,
      required,
      className,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const reactId = useId('textfield');
    const id = idProp ?? reactId;
    const descriptionId = `${id}-description`;

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });

    const description = error ? errorText : helperText;

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
          {startAdornment ? (
            <span className={styles.adornment} aria-hidden>
              {startAdornment}
            </span>
          ) : null}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            value={state}
            required={required}
            aria-invalid={error || undefined}
            aria-describedby={description ? descriptionId : undefined}
            onChange={(event) => {
              setState(event.target.value);
              onChange?.(event.target.value, event);
            }}
            {...props}
          />
          {endAdornment ? (
            <span className={styles.adornment} aria-hidden>
              {endAdornment}
            </span>
          ) : null}
        </div>
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
