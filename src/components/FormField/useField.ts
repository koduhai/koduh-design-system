import { createContext, useContext } from 'react';
import { useId } from '../../primitives';

export interface FieldContextValue {
  /** Control id; the label's htmlFor points here. */
  id: string;
  /** Description element id, present only when help/error text is shown. */
  describedById?: string;
  /** Whether the field is in an error state (→ aria-invalid). */
  invalid: boolean;
  required: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** Read the field wiring supplied by an ancestor <FormField>. Throws if absent. */
export function useFieldContext(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error('useFieldContext must be used within a <FormField>');
  return ctx;
}

/**
 * Like {@link useFieldContext}, but returns `null` instead of throwing when there
 * is no ancestor `<FormField>`. Lets a control opt into FormField composition
 * (deferring its label/aria to the field) while staying fully usable standalone.
 */
export function useOptionalFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface UseFieldOptions {
  id?: string;
  required?: boolean;
  error?: boolean;
  /** Whether a help/error description element will be rendered. */
  hasDescription?: boolean;
}

export interface UseFieldResult {
  id: string;
  descriptionId: string;
  invalid: boolean;
  required: boolean;
  labelProps: { htmlFor: string };
  descriptionProps: { id: string };
  controlProps: {
    id: string;
    required?: boolean;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
  };
}

/** Headless field-prop builder for controls built without the <FormField> chrome. */
export function useField(options: UseFieldOptions = {}): UseFieldResult {
  const reactId = useId('field');
  const id = options.id ?? reactId;
  const descriptionId = `${id}-description`;
  const invalid = Boolean(options.error);
  const required = Boolean(options.required);
  return {
    id,
    descriptionId,
    invalid,
    required,
    labelProps: { htmlFor: id },
    descriptionProps: { id: descriptionId },
    controlProps: {
      id,
      required: required || undefined,
      'aria-invalid': invalid || undefined,
      'aria-describedby': options.hasDescription ? descriptionId : undefined,
    },
  };
}
