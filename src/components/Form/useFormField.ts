import { useEffect, useSyncExternalStore } from 'react';
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

  // Register once per name; rules are read at registration time.
  useEffect(() => {
    api.register(name, rules);
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
