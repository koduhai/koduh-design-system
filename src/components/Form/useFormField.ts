import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useFormContext } from './FormContext';
import type { FieldRules } from './useForm';

export interface UseFormFieldResult {
  name: string;
  value: unknown;
  error: string | undefined;
  touched: boolean;
  dirty: boolean;
  onChange: (value: unknown, event?: unknown) => void;
  onBlur: () => void;
  setValue: (value: unknown) => void;
}

/** Subscribe to one field of the enclosing <Form>. Registers the field for validation. */
export function useFormField(name: string, rules?: FieldRules): UseFormFieldResult {
  const api = useFormContext();

  // Keep the latest rules in a ref so dynamic required/validate (e.g. a
  // `required` that toggles at runtime, or a `validate` closure capturing fresh
  // state) are honored without re-registering on every render. Rules objects are
  // typically recreated each render, so depending on them directly would churn.
  const rulesRef = useRef<FieldRules | undefined>(rules);
  rulesRef.current = rules;

  // Register once per name with a stable proxy that reads the live ref at
  // validation time. When the latest rules are undefined the proxy reports no
  // required/validate, so toggling rules off clears them too.
  useEffect(() => {
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
  }, [api, name]);

  const fieldState = useSyncExternalStore(
    api.subscribe,
    () => api.getFieldState(name),
    () => api.getFieldState(name),
  );

  return {
    name,
    value: fieldState.value,
    error: fieldState.error,
    touched: fieldState.touched,
    dirty: fieldState.dirty,
    onChange: (value) => api.setValue(name, value),
    onBlur: () => api.setTouched(name),
    setValue: (value) => api.setValue(name, value),
  };
}
