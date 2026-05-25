import { createContext, useContext } from 'react';
import type { FormApi } from './useForm';

export const FormContext = createContext<FormApi | null>(null);

/** Read the enclosing form api. Throws if there is no <Form> ancestor. */
export function useFormContext(): FormApi {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useFormContext must be used within a <Form>');
  return ctx;
}

/** Like useFormContext but returns null instead of throwing when outside a <Form>. */
export function useOptionalFormContext(): FormApi | null {
  return useContext(FormContext);
}
