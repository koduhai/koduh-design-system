import { useRef } from 'react';
import { get, setIn } from './path';
import type { FormValues, FormErrors, Resolver } from './resolver';

export type { FormValues, FormErrors, Resolver } from './resolver';
export type ValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export interface FieldRules {
  required?: boolean | string;
  validate?: (
    value: unknown,
    values: FormValues,
  ) => string | undefined | Promise<string | undefined>;
}

export interface FieldState {
  value: unknown;
  error: string | undefined;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  values: FormValues;
  errors: FormErrors;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  submitCount: number;
}

export interface UseFormOptions {
  defaultValues?: FormValues;
  resolver?: Resolver;
  mode?: ValidationMode;
  reValidateMode?: 'onChange' | 'onBlur';
}

export interface FormApi {
  getSnapshot: () => FormState;
  subscribe: (listener: () => void) => () => void;
  getValues: () => FormValues;
  getFieldState: (name: string) => FieldState;
  setValue: (name: string, value: unknown) => void;
  setTouched: (name: string, touched?: boolean) => void;
  setError: (name: string, message: string | undefined) => void;
  clearErrors: (name?: string) => void;
  reset: (values?: FormValues) => void;
  register: (name: string, rules?: FieldRules) => void;
  unregister: (name: string) => void;
  setFieldId: (name: string, id: string | undefined) => void;
  getFieldId: (name: string) => string | undefined;
  focusField: (name: string) => void;
  handleSubmit: (
    onValid: (values: FormValues) => void | Promise<void>,
    onInvalid?: (errors: FormErrors) => void,
  ) => (event?: { preventDefault?: () => void }) => Promise<void>;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function createFormStore(options: UseFormOptions = {}): FormApi {
  const mode: ValidationMode = options.mode ?? 'onSubmit';
  const reValidateMode = options.reValidateMode ?? 'onChange';
  const resolver = options.resolver;
  let defaults: FormValues = { ...(options.defaultValues ?? {}) };

  let state: FormState = {
    values: { ...defaults },
    errors: {},
    touched: {},
    dirty: {},
    isSubmitting: false,
    submitCount: 0,
  };

  const listeners = new Set<() => void>();
  const rules = new Map<string, FieldRules>();
  const ids = new Map<string, string>();
  const registered = new Set<string>();
  const fieldCache = new Map<string, FieldState>();

  function emit() {
    for (const l of listeners) l();
  }

  function setState(next: Partial<FormState>) {
    state = { ...state, ...next };
    emit();
  }

  function getFieldState(name: string): FieldState {
    const next: FieldState = {
      value: get(state.values, name),
      error: state.errors[name],
      touched: Boolean(state.touched[name]),
      dirty: Boolean(state.dirty[name]),
    };
    const prev = fieldCache.get(name);
    if (
      prev &&
      prev.value === next.value &&
      prev.error === next.error &&
      prev.touched === next.touched &&
      prev.dirty === next.dirty
    ) {
      return prev;
    }
    fieldCache.set(name, next);
    return next;
  }

  async function runValidation(): Promise<FormErrors> {
    let errors: FormErrors = {};
    for (const [name, rule] of rules) {
      const value = get(state.values, name);
      const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
      if (rule.required && empty) {
        errors[name] = typeof rule.required === 'string' ? rule.required : 'This field is required';
        continue;
      }
      if (rule.validate) {
        const msg = await rule.validate(value, state.values);
        if (msg) errors[name] = msg;
      }
    }
    if (resolver) {
      const res = await resolver(state.values);
      errors = { ...errors, ...res.errors };
    }
    return errors;
  }

  async function maybeValidate(trigger: 'change' | 'blur') {
    const first = state.submitCount === 0;
    const should = first
      ? (trigger === 'change' && mode === 'onChange') || (trigger === 'blur' && mode === 'onBlur')
      : (trigger === 'change' && reValidateMode === 'onChange') ||
        (trigger === 'blur' && reValidateMode === 'onBlur');
    if (!should) return;
    const errors = await runValidation();
    setState({ errors });
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getValues: () => state.values,
    getFieldState,
    setValue(name, value) {
      const values = setIn(state.values, name, value);
      const dirty = { ...state.dirty, [name]: !valuesEqual(value, get(defaults, name)) };
      setState({ values, dirty });
      void maybeValidate('change');
    },
    setTouched(name, touched = true) {
      setState({ touched: { ...state.touched, [name]: touched } });
      void maybeValidate('blur');
    },
    setError(name, message) {
      const errors = { ...state.errors };
      if (message !== undefined) errors[name] = message;
      else delete errors[name];
      setState({ errors });
    },
    clearErrors(name) {
      if (name == null) return setState({ errors: {} });
      const errors = { ...state.errors };
      delete errors[name];
      setState({ errors });
    },
    reset(values) {
      if (values) defaults = { ...values };
      state = {
        values: { ...defaults },
        errors: {},
        touched: {},
        dirty: {},
        isSubmitting: false,
        submitCount: 0,
      };
      fieldCache.clear();
      emit();
    },
    register(name, fieldRules) {
      registered.add(name);
      if (fieldRules) rules.set(name, fieldRules);
    },
    unregister(name) {
      registered.delete(name);
      rules.delete(name);
      ids.delete(name);
      fieldCache.delete(name);
      // Clear validation state so a removed (or remounted) field does not carry
      // stale errors/touched/dirty. Value is intentionally retained: field arrays
      // store their items under the array name (not per-field), and consumers may
      // rely on values persisting across conditional unmounts.
      const hasError = name in state.errors;
      const hasTouched = name in state.touched;
      const hasDirty = name in state.dirty;
      if (hasError || hasTouched || hasDirty) {
        const errors = { ...state.errors };
        const touched = { ...state.touched };
        const dirty = { ...state.dirty };
        delete errors[name];
        delete touched[name];
        delete dirty[name];
        setState({ errors, touched, dirty });
      }
    },
    setFieldId(name, id) {
      if (id) ids.set(name, id);
      else ids.delete(name);
    },
    getFieldId: (name) => ids.get(name),
    focusField(name) {
      const id = ids.get(name);
      if (id && typeof document !== 'undefined') {
        document.getElementById(id)?.focus();
      }
    },
    handleSubmit(onValid, onInvalid) {
      return async (event) => {
        if (state.isSubmitting) return;
        event?.preventDefault?.();
        const allTouched: Record<string, boolean> = { ...state.touched };
        for (const n of registered) allTouched[n] = true;
        setState({
          isSubmitting: true,
          submitCount: state.submitCount + 1,
          touched: allTouched,
        });
        const errors = await runValidation();
        if (Object.keys(errors).length > 0) {
          // Mark every field that has an error as touched so error messages show
          const touchedWithErrors = { ...allTouched };
          for (const n of Object.keys(errors)) touchedWithErrors[n] = true;
          setState({ errors, isSubmitting: false, touched: touchedWithErrors });
          const firstName = Object.keys(errors)[0]!;
          const id = ids.get(firstName);
          if (id && typeof document !== 'undefined') {
            document.getElementById(id)?.focus();
          }
          onInvalid?.(errors);
          return;
        }
        setState({ errors: {} });
        try {
          await onValid(state.values);
        } finally {
          setState({ isSubmitting: false });
        }
      };
    },
  };
}

/** Create a stable form instance for the lifetime of the component. */
export function useForm(options: UseFormOptions = {}): FormApi {
  const ref = useRef<FormApi | null>(null);
  if (ref.current === null) ref.current = createFormStore(options);
  return ref.current;
}
