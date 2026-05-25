import { forwardRef, useEffect } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFormContext } from '../Form/FormContext';
import { useFormField } from '../Form/useFormField';
import { FieldContext } from './useField';
import type { FieldContextValue } from './useField';
import styles from './FormField.module.css';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  /** Bind this field to an enclosing <Form> by name (form supplies value + error). */
  name?: string;
  required?: boolean;
  error?: boolean;
  /** Shown when `error`; replaces helperText. Ignored for bound fields (the form supplies it). */
  errorText?: ReactNode;
  helperText?: ReactNode;
  id?: string;
  children: ReactNode;
}

interface ViewProps {
  id: string;
  ctx: FieldContextValue;
  label: ReactNode;
  required: boolean;
  error: boolean;
  description: ReactNode;
  className?: string;
  rest: HTMLAttributes<HTMLDivElement>;
  forwardedRef: Ref<HTMLDivElement>;
  children: ReactNode;
}

function FormFieldView({
  id,
  ctx,
  label,
  required,
  error,
  description,
  className,
  rest,
  forwardedRef,
  children,
}: ViewProps) {
  return (
    <div
      ref={forwardedRef}
      className={cx(styles.root, className)}
      data-error={error ? 'true' : undefined}
      {...rest}
    >
      <label id={ctx.labelId} className={styles.label} htmlFor={id}>
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
        <p id={ctx.describedById} className={styles.description}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

const StandaloneFormField = forwardRef<HTMLDivElement, FormFieldProps>(
  function StandaloneFormField(
    {
      label,
      required = false,
      error = false,
      errorText,
      helperText,
      id: idProp,
      className,
      children,
      name: _name,
      ...rest
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
      <FormFieldView
        id={id}
        ctx={ctx}
        label={label}
        required={required}
        error={error}
        description={description}
        className={className}
        rest={rest}
        forwardedRef={ref}
      >
        {children}
      </FormFieldView>
    );
  },
);

const BoundFormField = forwardRef<HTMLDivElement, FormFieldProps & { name: string }>(
  function BoundFormField(
    {
      label,
      required = false,
      helperText,
      id: idProp,
      className,
      children,
      name,
      error: _e,
      errorText: _et,
      ...rest
    },
    ref,
  ) {
    const reactId = useId('field');
    const id = idProp ?? reactId;
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;
    const field = useFormField(name);
    const formError = field.error;
    const hasError = Boolean(formError);
    const description = hasError ? formError : helperText;

    const api = useOptionalFormContext();
    useEffect(() => {
      if (api) {
        api.setFieldId(name, id);
        return () => api.setFieldId(name, undefined);
      }
    }, [api, name, id]);

    const ctx: FieldContextValue = {
      id,
      labelId,
      describedById: description != null ? descriptionId : undefined,
      invalid: hasError,
      required,
      binding: {
        name,
        value: field.value,
        onChange: field.onChange,
        onBlur: field.onBlur,
      },
    };
    return (
      <FormFieldView
        id={id}
        ctx={ctx}
        label={label}
        required={required}
        error={hasError}
        description={description}
        className={className}
        rest={rest}
        forwardedRef={ref}
      >
        {children}
      </FormFieldView>
    );
  },
);

export const FormField = /* @__PURE__ */ forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(props, ref) {
    const form = useOptionalFormContext();
    if (props.name != null && form) {
      return <BoundFormField ref={ref} {...(props as FormFieldProps & { name: string })} />;
    }
    return <StandaloneFormField ref={ref} {...props} />;
  },
);
