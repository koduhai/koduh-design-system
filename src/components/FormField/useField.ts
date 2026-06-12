import { createContext, useContext } from 'react';
import { useId } from '../../primitives';

export interface FieldBinding {
  name: string;
  value: unknown;
  onChange: (value: unknown, event?: unknown) => void;
  onBlur: () => void;
}

export interface FieldContextValue {
  /** Control id; the label's htmlFor points here. */
  id: string;
  /**
   * Label element id. Group controls (radiogroup/group) can't be associated via
   * the label's `htmlFor` (it only labels labelable elements), so they reference
   * this with `aria-labelledby` instead.
   */
  labelId: string;
  /** Description element id, present only when help/error text is shown. */
  describedById?: string;
  /** Whether the field is in an error state (→ aria-invalid). */
  invalid: boolean;
  required: boolean;
  /** Present when the field is bound to a <Form>; carries form value + handlers. */
  binding?: FieldBinding;
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

/**
 * The kind of operable element a control exposes, which decides WHICH ARIA
 * attributes are valid on it (axe aria-allowed-attr):
 * - `labelable`: a native input/textarea/checkbox/switch. Named by the FormField
 *   `<label htmlFor>`, so it only needs an id; uses native `required` and
 *   `aria-invalid`. Must NOT get `aria-labelledby`/`aria-required`.
 * - `widget`: a `radiogroup` | `listbox` | `combobox`. Named by `aria-labelledby`
 *   and supports the full validity set (`aria-invalid`, `aria-required`).
 * - `named`: a `button` | `group` | `dialog` role. Named by `aria-labelledby`,
 *   but `aria-required`/`aria-invalid` are NOT allowed, so they are omitted (the
 *   error is conveyed via `aria-describedby`, required via the label/native input).
 */
export type FieldControlKind = 'labelable' | 'widget' | 'named';

export interface FieldControlProps {
  id: string;
  required?: true;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

/**
 * Returns the ARIA wiring for a control composed inside a `<FormField>`, branched
 * by `kind` so each role only receives attributes it actually supports. Returns
 * `null` when there is no enclosing `<FormField>` (the control uses its own
 * label/required/error props). Centralizes the per-role rules so a control can't
 * accidentally put `aria-required` on a `role="button"` (axe aria-allowed-attr).
 */
export function useFieldControlProps(kind: FieldControlKind): FieldControlProps | null {
  const field = useContext(FieldContext);
  if (!field) return null;
  const props: FieldControlProps = { id: field.id };
  if (field.describedById) props['aria-describedby'] = field.describedById;
  if (kind === 'labelable') {
    if (field.required) props.required = true;
    if (field.invalid) props['aria-invalid'] = true;
  } else if (kind === 'widget') {
    props['aria-labelledby'] = field.labelId;
    if (field.invalid) props['aria-invalid'] = true;
    if (field.required) props['aria-required'] = true;
  } else {
    props['aria-labelledby'] = field.labelId;
  }
  return props;
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
