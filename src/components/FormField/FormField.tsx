import { forwardRef, useEffect, useRef, useSyncExternalStore } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFormContext } from '../Form/FormContext';
import type { FieldRules, FieldState, FormApi } from '../Form/useForm';
import { FieldContext } from './useField';
import type { FieldBinding, FieldContextValue } from './useField';
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

/** Field state returned for an unbound field (no enclosing <Form>). */
const UNBOUND_STATE: FieldState = {
  value: undefined,
  error: undefined,
  touched: false,
  dirty: false,
};

interface BindingResult {
  /** Present only when the field is bound to a <Form>. */
  binding: FieldBinding | undefined;
  /** The form-supplied error, when bound. */
  formError: string | undefined;
}

/**
 * Drives the optional binding of a FormField to an enclosing <Form>. This always
 * calls the same hooks (so hook order is stable even as `name`/the <Form> provider
 * appears or disappears), and simply no-ops every form interaction when there is no
 * binding. Unifying the bound and standalone paths into ONE component this way keeps
 * the child subtree mounted across that transition, so toggling `name` or a
 * late-mounting <Form> no longer remounts the input (which would lose focus/cursor).
 *
 * It mirrors useFormField's registration + subscription, but tolerates a null api so
 * it can run on a standalone field. useFormField itself is left unchanged (it is part
 * of the public API and requires a <Form>).
 */
function useOptionalBinding(
  name: string | undefined,
  required: boolean,
  api: FormApi | null,
): BindingResult {
  const bound = name != null && api != null;

  // Keep the latest rules in a ref so a `required` that toggles at runtime is read
  // at validation time without re-registering. Mirrors useFormField.
  const rulesRef = useRef<FieldRules | undefined>(undefined);
  rulesRef.current = required ? { required: true } : undefined;

  useEffect(() => {
    if (!bound || !api) return;
    const proxy: FieldRules = {
      get required() {
        return rulesRef.current?.required;
      },
      get validate() {
        return rulesRef.current?.validate;
      },
    };
    api.register(name, proxy);
    return () => api.unregister(name);
  }, [api, name, bound]);

  // Revalidate when `required` toggles at runtime so an on-screen error reflects the
  // new rule immediately. The store no-ops this before the first submit, so it never
  // surfaces errors early. Skip the first run (registration already covers it).
  const firstRulesRun = useRef(true);
  useEffect(() => {
    if (firstRulesRun.current) {
      firstRulesRun.current = false;
      return;
    }
    if (bound && api) api.revalidate();
  }, [api, bound, required]);

  const fieldState = useSyncExternalStore(
    (listener) => (bound && api ? api.subscribe(listener) : () => {}),
    () => (bound && api ? api.getFieldState(name) : UNBOUND_STATE),
    () => (bound && api ? api.getFieldState(name) : UNBOUND_STATE),
  );

  if (!bound || !api || name == null) {
    return { binding: undefined, formError: undefined };
  }
  return {
    binding: {
      name,
      value: fieldState.value,
      onChange: (value) => api.setValue(name, value),
      onBlur: () => api.setTouched(name),
    },
    formError: fieldState.error,
  };
}

export const FormField = /* @__PURE__ */ forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(
    {
      label,
      name,
      required = false,
      error = false,
      errorText,
      helperText,
      id: idProp,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const reactId = useId('field');
    const id = idProp ?? reactId;
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;

    const api = useOptionalFormContext();
    const { binding, formError } = useOptionalBinding(name, required, api);
    const isBound = binding !== undefined;

    // Register the field's control id with the form so error focus can target it.
    useEffect(() => {
      if (isBound && api && name != null) {
        api.setFieldId(name, id);
        return () => api.setFieldId(name, undefined);
      }
    }, [api, isBound, name, id]);

    // Bound fields take their error from the form; standalone fields from props.
    const hasError = isBound ? Boolean(formError) : error;
    const description = isBound
      ? hasError
        ? formError
        : helperText
      : hasError
        ? errorText
        : helperText;

    const ctx: FieldContextValue = {
      id,
      labelId,
      describedById: description != null ? descriptionId : undefined,
      invalid: hasError,
      required,
      binding,
    };

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        data-error={hasError ? 'true' : undefined}
        {...rest}
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
