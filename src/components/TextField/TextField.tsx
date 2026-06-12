import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import styles from './TextField.module.css';

export type TextFieldSize = 'sm' | 'md' | 'lg';

/**
 * Field density. Mirrors the `[data-density]` token mechanism (`--ku-density-*`
 * vars). `comfortable` is the default; `compact` tightens the field's internal
 * padding without dropping the hit-target floor. Same literal as Table/Select/Menu.
 */
export type Density = 'comfortable' | 'compact';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Visible label, associated with the input via htmlFor/id. Provide `label`, or wrap the control in a `<FormField>` which supplies it. */
  label?: ReactNode;
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
  /**
   * Field density. `compact` tightens the field's vertical/horizontal padding
   * via the `--ku-density-*` vars. Omit to inherit a `data-density` set on an
   * ancestor (defaults to comfortable); set explicitly to set `data-density`.
   */
  density?: Density;
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
      onBlur,
      helperText,
      error = false,
      errorText,
      size = 'md',
      density,
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
    const field = useOptionalFieldContext();
    // When inside a <FormField>, defer label/required/aria to it; otherwise use own props.
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
    const showOwnLabel = !field; // FormField renders the label when present

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });

    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? String(bound.value ?? '') : state;

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-density={density}
        data-error={invalid ? 'true' : undefined}
      >
        {showOwnLabel ? (
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
          {startAdornment ? (
            <span className={styles.adornment} aria-hidden>
              {startAdornment}
            </span>
          ) : null}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            value={currentValue}
            required={isRequired}
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
          {endAdornment ? (
            <span className={styles.adornment} aria-hidden>
              {endAdornment}
            </span>
          ) : null}
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
