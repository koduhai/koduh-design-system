import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { FieldContext } from './useField';
import type { FieldContextValue } from './useField';
import styles from './FormField.module.css';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  required?: boolean;
  error?: boolean;
  /** Shown when `error`; replaces helperText. */
  errorText?: ReactNode;
  helperText?: ReactNode;
  /** Base id; the control + description ids derive from it. */
  id?: string;
  /** The control — reads wiring via useFieldContext(). */
  children: ReactNode;
}

export const FormField = /* @__PURE__ */ forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(
    {
      label,
      required = false,
      error = false,
      errorText,
      helperText,
      id: idProp,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const reactId = useId('field');
    const id = idProp ?? reactId;
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;
    const description = error ? errorText : helperText;
    const ctx: FieldContextValue = {
      id,
      labelId,
      describedById: description != null ? descriptionId : undefined,
      invalid: error,
      required,
    };
    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        data-error={error ? 'true' : undefined}
        {...props}
      >
        <label id={labelId} className={styles.label} htmlFor={id}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </label>
        <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
        {description != null ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
