# Form orchestration layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Form`/`useForm` orchestration layer (values, validation, submission, field arrays, error summary) on top of the existing `FormField` field layer, with no breaking changes.

**Architecture:** A headless external store (`createFormStore`) holds form state; React subscribes per-field via `useSyncExternalStore`. A name-aware `FormField` auto-wires `value`/`onChange`/`onBlur` into existing controlled inputs through an optional `binding` on the existing `FieldContext`. Validation is pluggable via a `resolver` (Standard Schema adapter, zero hard dep) plus per-field rules.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules, Vitest + Testing Library, Playwright + axe. Zero new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-05-24-form-orchestration-design.md`

**Parallelization note (for the integrator):** Tasks 1–2 are independent and can run in parallel worktrees. Task 3 (store) is the foundation for 4,5,8,9. Tasks 4–9 are sequential-ish on the store but small. Task 7's nine input edits are independent of each other once Task 6 lands and can be parallelized. Tasks 10–12 are central integration. If using parallel subagents, group: {1,2} ‖, then 3, then {4→5→6}, then 7×9 ‖, then {8,9} ‖, then 10,11,12 central.

---

## Task 1: Path helpers (`get`/`set`/`unset`)

**Files:**
- Create: `src/components/Form/path.ts`
- Test: `src/components/Form/path.test.ts`

Field names are dotted paths (`items.0.title`). Values are stored as nested objects/arrays so a schema resolver sees the natural shape. These helpers read/write by path immutably.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/Form/path.test.ts
import { describe, it, expect } from 'vitest';
import { get, setIn, unsetIn } from './path';

describe('path helpers', () => {
  it('gets nested values by dotted path', () => {
    const obj = { a: { b: [{ c: 1 }] } };
    expect(get(obj, 'a.b.0.c')).toBe(1);
    expect(get(obj, 'a.b.0')).toEqual({ c: 1 });
    expect(get(obj, 'a.missing')).toBeUndefined();
    expect(get(obj, 'x.y.z')).toBeUndefined();
  });

  it('sets nested values immutably, creating arrays for numeric segments', () => {
    const obj = { a: { b: 1 } };
    const next = setIn(obj, 'a.c.0', 'x');
    expect(next).toEqual({ a: { b: 1, c: ['x'] } });
    expect(obj).toEqual({ a: { b: 1 } }); // original untouched
  });

  it('sets a top-level key', () => {
    expect(setIn({}, 'name', 'Ada')).toEqual({ name: 'Ada' });
  });

  it('unsets a nested value immutably', () => {
    const obj = { a: { b: 1, c: 2 } };
    const next = unsetIn(obj, 'a.b');
    expect(next).toEqual({ a: { c: 2 } });
    expect(obj).toEqual({ a: { b: 1, c: 2 } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/path.test.ts`
Expected: FAIL — `Failed to resolve import './path'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/path.ts
type AnyRecord = Record<string, unknown>;

function toSegments(path: string): string[] {
  return path.split('.');
}

/** Read a value by dotted path. Returns undefined for any missing segment. */
export function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of toSegments(path)) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as AnyRecord)[seg];
  }
  return cur;
}

function clone(node: unknown, numericNext: boolean): AnyRecord | unknown[] {
  if (Array.isArray(node)) return node.slice();
  if (node != null && typeof node === 'object') return { ...(node as AnyRecord) };
  return numericNext ? [] : {};
}

/** Immutably set a value by dotted path; numeric segments create arrays. */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const segs = toSegments(path);
  const root = clone(obj, /^\d+$/.test(segs[0]!));
  let cur: AnyRecord | unknown[] = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    const nextNumeric = /^\d+$/.test(segs[i + 1]!);
    const child = clone((cur as AnyRecord)[seg], nextNumeric);
    (cur as AnyRecord)[seg] = child;
    cur = child;
  }
  (cur as AnyRecord)[segs[segs.length - 1]!] = value;
  return root as T;
}

/** Immutably remove a value by dotted path. */
export function unsetIn<T>(obj: T, path: string): T {
  const segs = toSegments(path);
  const root = clone(obj, false);
  let cur: AnyRecord | unknown[] = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    const child = (cur as AnyRecord)[seg];
    if (child == null || typeof child !== 'object') return obj; // nothing to unset
    const cloned = clone(child, false);
    (cur as AnyRecord)[seg] = cloned;
    cur = cloned;
  }
  delete (cur as AnyRecord)[segs[segs.length - 1]!];
  return root as T;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/path.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/path.ts src/components/Form/path.test.ts
git commit --no-verify -m "feat(form): add immutable path get/set/unset helpers (#38)"
```

---

## Task 2: Resolver types + `standardSchemaResolver`

**Files:**
- Create: `src/components/Form/resolver.ts`
- Test: `src/components/Form/resolver.test.ts`

A `Resolver` maps values → `{ values, errors }`. `standardSchemaResolver` adapts any [Standard Schema](https://standardschema.dev) validator (the `~standard` interface that zod/valibot/arktype implement) without a hard dependency.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/Form/resolver.test.ts
import { describe, it, expect } from 'vitest';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';

// Hand-rolled fake Standard Schema validator — proves the adapter contract
// without depending on a real schema library.
function fakeSchema(): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'fake',
      validate(value: unknown) {
        const v = value as { email?: string; age?: number };
        const issues: { message: string; path: (string | number)[] }[] = [];
        if (!v.email) issues.push({ message: 'Email required', path: ['email'] });
        if (v.age != null && v.age < 18)
          issues.push({ message: 'Must be 18+', path: ['age'] });
        return issues.length ? { issues } : { value: v };
      },
    },
  };
}

describe('standardSchemaResolver', () => {
  it('returns flat errors keyed by dotted path on failure', async () => {
    const resolve = standardSchemaResolver(fakeSchema());
    const result = await resolve({ age: 15 });
    expect(result.errors).toEqual({ email: 'Email required', age: 'Must be 18+' });
  });

  it('returns parsed values and no errors on success', async () => {
    const resolve = standardSchemaResolver(fakeSchema());
    const result = await resolve({ email: 'a@b.com', age: 20 });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ email: 'a@b.com', age: 20 });
  });

  it('supports async validators', async () => {
    const schema: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'fake-async',
        async validate() {
          return { issues: [{ message: 'nope', path: ['x'] }] };
        },
      },
    };
    const result = await standardSchemaResolver(schema)({});
    expect(result.errors).toEqual({ x: 'nope' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/resolver.test.ts`
Expected: FAIL — cannot resolve `./resolver`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/resolver.ts
export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;

export interface ResolverResult {
  values: FormValues;
  errors: FormErrors;
}

/** Schema-level validation: values in, parsed values + flat errors out. Sync or async. */
export type Resolver = (values: FormValues) => ResolverResult | Promise<ResolverResult>;

/** Minimal slice of the Standard Schema v1 interface we depend on. */
export interface StandardSchemaV1 {
  '~standard': {
    version: 1;
    vendor: string;
    validate: (value: unknown) =>
      | { value: unknown; issues?: undefined }
      | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number | { key: string | number }> }> }
      | Promise<
          | { value: unknown; issues?: undefined }
          | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number | { key: string | number }> }> }
        >;
  };
}

function pathToKey(path: ReadonlyArray<string | number | { key: string | number }> | undefined): string {
  if (!path || path.length === 0) return '';
  return path
    .map((seg) => (typeof seg === 'object' ? String(seg.key) : String(seg)))
    .join('.');
}

/** Adapt any Standard Schema validator into a {@link Resolver}. No hard dependency. */
export function standardSchemaResolver(schema: StandardSchemaV1): Resolver {
  return async (values) => {
    const result = await schema['~standard'].validate(values);
    if (!('issues' in result) || !result.issues) {
      return { values: result.value as FormValues, errors: {} };
    }
    const errors: FormErrors = {};
    for (const issue of result.issues) {
      const key = pathToKey(issue.path);
      if (key && !(key in errors)) errors[key] = issue.message;
    }
    return { values, errors };
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/resolver.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/resolver.ts src/components/Form/resolver.test.ts
git commit --no-verify -m "feat(form): add Resolver type + standardSchemaResolver adapter (#38)"
```

---

## Task 3: `createFormStore` + `useForm`

**Files:**
- Create: `src/components/Form/useForm.ts`
- Test: `src/components/Form/useForm.test.tsx`

The headless core. `createFormStore` is a closure holding mutable `state` (read fresh inside callbacks — no stale closures) with immutable updates + a subscriber set. `useForm` instantiates one per component via a ref. Per-field snapshots are identity-cached so `useSyncExternalStore` stays stable.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/useForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from './useForm';

describe('useForm', () => {
  it('seeds values from defaultValues and tracks dirty', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { name: 'Ada' } }));
    expect(result.current.getFieldState('name').value).toBe('Ada');
    expect(result.current.getFieldState('name').dirty).toBe(false);
    act(() => result.current.setValue('name', 'Grace'));
    expect(result.current.getFieldState('name').value).toBe('Grace');
    expect(result.current.getFieldState('name').dirty).toBe(true);
  });

  it('getFieldState returns a stable reference when unchanged', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    const first = result.current.getFieldState('a');
    expect(result.current.getFieldState('a')).toBe(first);
    act(() => result.current.setValue('a', 2));
    expect(result.current.getFieldState('a')).not.toBe(first);
  });

  it('marks touched on setTouched', () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.setTouched('email'));
    expect(result.current.getFieldState('email').touched).toBe(true);
  });

  it('reset restores default values and clears errors/touched', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    act(() => {
      result.current.setValue('a', 9);
      result.current.setError('a', 'bad');
      result.current.setTouched('a');
    });
    act(() => result.current.reset());
    expect(result.current.getFieldState('a').value).toBe(1);
    expect(result.current.getFieldState('a').error).toBeUndefined();
    expect(result.current.getFieldState('a').touched).toBe(false);
  });

  it('handleSubmit calls onValid with values when valid', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() => useForm({ defaultValues: { name: 'Ada' } }));
    await act(async () => {
      await result.current.handleSubmit(onValid)({ preventDefault: () => {} });
    });
    expect(onValid).toHaveBeenCalledWith({ name: 'Ada' });
  });

  it('handleSubmit runs resolver, surfaces errors, calls onInvalid, skips onValid', async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const resolver = vi.fn(async (values: Record<string, unknown>) => ({
      values,
      errors: values.name ? {} : { name: 'Required' },
    }));
    const { result } = renderHook(() => useForm({ resolver }));
    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith({ name: 'Required' });
    expect(result.current.getFieldState('name').error).toBe('Required');
    expect(result.current.getFieldState('name').touched).toBe(true);
  });

  it('field-level required rule produces an error on submit', async () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.register('email', { required: 'Email please' }));
    await act(async () => {
      await result.current.handleSubmit(vi.fn())();
    });
    expect(result.current.getFieldState('email').error).toBe('Email please');
  });

  it('resolver error wins over a field-level error on the same field', async () => {
    const resolver = vi.fn(async (v: Record<string, unknown>) => ({ values: v, errors: { a: 'from resolver' } }));
    const { result } = renderHook(() => useForm({ resolver }));
    act(() => result.current.register('a', { validate: () => 'from field' }));
    await act(async () => { await result.current.handleSubmit(vi.fn())(); });
    expect(result.current.getFieldState('a').error).toBe('from resolver');
  });

  it('mode onChange validates on each setValue', async () => {
    const resolver = vi.fn(async (v: Record<string, unknown>) => ({
      values: v,
      errors: (v.a as number) > 0 ? {} : { a: 'positive' },
    }));
    const { result } = renderHook(() => useForm({ mode: 'onChange', resolver }));
    await act(async () => { result.current.setValue('a', -1); });
    await waitFor(() => expect(result.current.getFieldState('a').error).toBe('positive'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/useForm.test.tsx`
Expected: FAIL — cannot resolve `./useForm`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/useForm.ts
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
      const empty =
        value == null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (rule.required && empty) {
        errors[name] =
          typeof rule.required === 'string' ? rule.required : 'This field is required';
        continue;
      }
      if (rule.validate) {
        const msg = await rule.validate(value, state.values);
        if (msg) errors[name] = msg;
      }
    }
    if (resolver) {
      const res = await resolver(state.values);
      errors = { ...errors, ...res.errors }; // resolver wins on conflict
    }
    return errors;
  }

  async function maybeValidate(trigger: 'change' | 'blur') {
    const first = state.submitCount === 0;
    const should = first
      ? (trigger === 'change' && mode === 'onChange') ||
        (trigger === 'blur' && mode === 'onBlur')
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
      if (message) errors[name] = message;
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
          setState({ errors, isSubmitting: false });
          const firstName = Object.keys(errors)[0]!;
          focusFieldDeferred(firstName);
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

      function focusFieldDeferred(name: string) {
        const id = ids.get(name);
        if (id && typeof document !== 'undefined') {
          document.getElementById(id)?.focus();
        }
      }
    },
  };
}

/** Create a stable form instance for the lifetime of the component. */
export function useForm(options: UseFormOptions = {}): FormApi {
  const ref = useRef<FormApi | null>(null);
  if (ref.current === null) ref.current = createFormStore(options);
  return ref.current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/useForm.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/useForm.ts src/components/Form/useForm.test.tsx
git commit --no-verify -m "feat(form): add createFormStore + useForm headless core (#38)"
```

---

## Task 4: `FormContext` + `<Form>` provider

**Files:**
- Create: `src/components/Form/FormContext.ts`
- Create: `src/components/Form/Form.tsx`
- Create: `src/components/Form/Form.module.css`
- Test: `src/components/Form/Form.test.tsx`

`<Form form={api}>` renders a native `<form>`, wires submit to `api.handleSubmit`, and provides the api via context.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/Form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Form } from './Form';
import { useForm } from './useForm';
import { useOptionalFormContext } from './FormContext';

describe('Form', () => {
  it('renders a form element and forwards className + DOM props', () => {
    const { result } = renderHook(() => useForm());
    render(
      <Form form={result.current} className="x" aria-label="signup" data-test="f">
        <button type="submit">Go</button>
      </Form>,
    );
    const form = screen.getByRole('form', { name: 'signup' });
    expect(form).toHaveClass('x');
    expect(form).toHaveAttribute('data-test', 'f');
  });

  it('calls onValid on submit', () => {
    const onValid = vi.fn();
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    render(
      <Form form={result.current} onValid={onValid} aria-label="f">
        <button type="submit">Go</button>
      </Form>,
    );
    fireEvent.click(screen.getByText('Go'));
    expect(onValid).toHaveBeenCalledWith({ a: 1 });
  });

  it('exposes the api through context', () => {
    const { result } = renderHook(() => useForm());
    let seen: unknown = null;
    function Probe() {
      seen = useOptionalFormContext();
      return null;
    }
    render(
      <Form form={result.current} aria-label="f">
        <Probe />
      </Form>,
    );
    expect(seen).toBe(result.current);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/Form.test.tsx`
Expected: FAIL — cannot resolve `./Form` / `./FormContext`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/FormContext.ts
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
```

```css
/* src/components/Form/Form.module.css */
.root {
  display: block;
}
```

```tsx
// src/components/Form/Form.tsx
import { forwardRef } from 'react';
import type { FormHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { FormContext } from './FormContext';
import type { FormApi, FormValues, FormErrors } from './useForm';
import styles from './Form.module.css';

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** The form instance from useForm(). */
  form: FormApi;
  /** Called with validated values on a successful submit. */
  onValid?: (values: FormValues) => void | Promise<void>;
  /** Called with the error map when submit fails validation. */
  onInvalid?: (errors: FormErrors) => void;
}

export const Form = /* @__PURE__ */ forwardRef<HTMLFormElement, FormProps>(function Form(
  { form, onValid, onInvalid, className, children, ...props },
  ref,
) {
  const submit = form.handleSubmit(onValid ?? (() => {}), onInvalid);
  return (
    <FormContext.Provider value={form}>
      <form
        ref={ref}
        className={cx(styles.root, className)}
        noValidate
        onSubmit={(e) => void submit(e)}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/Form.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/FormContext.ts src/components/Form/Form.tsx src/components/Form/Form.module.css src/components/Form/Form.test.tsx
git commit --no-verify -m "feat(form): add FormContext + Form provider (#38)"
```

---

## Task 5: `useFormField` hook

**Files:**
- Create: `src/components/Form/useFormField.ts`
- Test: `src/components/Form/useFormField.test.tsx`

Subscribes to one field's slice via `useSyncExternalStore`; registers/unregisters the field; returns value + state + handlers.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/useFormField.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { useFormField } from './useFormField';
import type { FormApi } from './useForm';

function Probe({ name }: { name: string }) {
  const f = useFormField(name);
  return (
    <div>
      <span data-testid="val">{String(f.value ?? '')}</span>
      <span data-testid="touched">{String(f.touched)}</span>
      <button onClick={() => f.onChange('hi')}>set</button>
      <button onClick={() => f.onBlur()}>blur</button>
    </div>
  );
}

function setup(api: FormApi) {
  return render(
    <Form form={api} aria-label="f">
      <Probe name="greeting" />
    </Form>,
  );
}

describe('useFormField', () => {
  it('reflects the field value and updates on onChange', () => {
    let api!: FormApi;
    function Wrap() {
      api = useForm({ defaultValues: { greeting: 'hello' } });
      return <Form form={api} aria-label="f"><Probe name="greeting" /></Form>;
    }
    render(<Wrap />);
    expect(screen.getByTestId('val')).toHaveTextContent('hello');
    fireEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('val')).toHaveTextContent('hi');
  });

  it('marks touched on onBlur', () => {
    let api!: FormApi;
    function Wrap() {
      api = useForm();
      return <Form form={api} aria-label="f"><Probe name="greeting" /></Form>;
    }
    render(<Wrap />);
    expect(screen.getByTestId('touched')).toHaveTextContent('false');
    fireEvent.click(screen.getByText('blur'));
    expect(screen.getByTestId('touched')).toHaveTextContent('true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/useFormField.test.tsx`
Expected: FAIL — cannot resolve `./useFormField`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/useFormField.ts
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
    // eslint-disable-next-line -- repo has no exhaustive-deps rule; rules read at mount by design
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/useFormField.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/useFormField.ts src/components/Form/useFormField.test.tsx
git commit --no-verify -m "feat(form): add useFormField slice-subscription hook (#38)"
```

---

## Task 6: Extend `FieldContext` with `binding`; add `name` to `FormField`

**Files:**
- Modify: `src/components/FormField/useField.ts` (add `FieldBinding` + `binding` on `FieldContextValue`)
- Modify: `src/components/FormField/FormField.tsx` (split into decider + view; bound path uses `useFormField`)
- Test: `src/components/FormField/FormField.test.tsx` (add bound-mode cases; keep existing passing)

The decider component avoids conditional hooks: `FormField` renders `BoundFormField` (calls `useFormField`) when `name` + a `<Form>` are present, else `StandaloneFormField`; both render the shared `FormFieldView`.

- [ ] **Step 1: Write the failing test** (append to existing `FormField.test.tsx`)

```tsx
// add these imports at top of src/components/FormField/FormField.test.tsx
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useOptionalFieldContext } from './useField';

// add this describe block
describe('FormField bound to a Form', () => {
  function BindingProbe() {
    const ctx = useOptionalFieldContext();
    return (
      <input
        aria-label="probe"
        value={String(ctx?.binding?.value ?? '')}
        onChange={(e) => ctx?.binding?.onChange(e.target.value, e)}
      />
    );
  }

  it('provides a binding carrying the form value and pushes changes back', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { city: 'Paris' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="city" label="City">
            <BindingProbe />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText('probe') as HTMLInputElement;
    expect(input.value).toBe('Paris');
    fireEvent.change(input, { target: { value: 'Lyon' } });
    expect(input.value).toBe('Lyon');
  });

  it('renders the form error as the description and sets aria-invalid wiring', async () => {
    function Wrap() {
      const form = useForm({
        resolver: async (v) => ({ values: v, errors: v.city ? {} : { city: 'Required' } }),
      });
      return (
        <Form form={form} aria-label="f">
          <FormField name="city" label="City">
            <BindingProbe />
          </FormField>
          <button type="submit">Go</button>
        </Form>
      );
    }
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('Required')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/FormField/FormField.test.tsx`
Expected: FAIL — `binding` does not exist on `FieldContextValue` / no error rendered (name prop unsupported).

- [ ] **Step 3a: Extend `useField.ts`** — add the binding type and field, leave everything else intact.

```ts
// src/components/FormField/useField.ts — add above FieldContextValue
export interface FieldBinding {
  name: string;
  value: unknown;
  onChange: (value: unknown, event?: unknown) => void;
  onBlur: () => void;
}
```

```ts
// inside FieldContextValue interface, add:
  /** Present when the field is bound to a <Form>; carries form value + handlers. */
  binding?: FieldBinding;
```

- [ ] **Step 3b: Rewrite `FormField.tsx`** as decider + view.

```tsx
// src/components/FormField/FormField.tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
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
  forwardedRef: React.Ref<HTMLDivElement>;
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
    { label, required = false, error = false, errorText, helperText, id: idProp, className, children, name: _name, ...rest },
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
    { label, required = false, helperText, id: idProp, className, children, name, error: _e, errorText: _et, ...rest },
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

    // Register this field's control id so the form can focus it on submit.
    const api = useOptionalFormContext();
    if (api && api.getFieldId(name) !== id) api.setFieldId(name, id);

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/FormField/FormField.test.tsx`
Expected: PASS (existing tests + 2 new bound-mode tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/FormField/useField.ts src/components/FormField/FormField.tsx src/components/FormField/FormField.test.tsx
git commit --no-verify -m "feat(form): FormField binds to Form via name + FieldContext binding (#38)"
```

---

## Task 7: Wire `binding` consumption into the 9 value-bearing inputs

**Files (modify each + add one binding test to its `*.test.tsx`):**
`TextField`, `Textarea`, `NumberField`, `Select`, `Combobox`, `TagInput`, `PinInput`, `DatePicker`, `ToggleGroup`.

**The uniform transformation** (additive — standalone behavior unchanged). In each component, after the existing `const field = useOptionalFieldContext();` and the existing `useControllableState` (call its tuple `[ownState, setOwnState]`):

```ts
// Binding is active only when inside a bound FormField AND no explicit value prop was given.
const bound = value === undefined ? field?.binding : undefined;
const currentValue = bound ? (bound.value as <T>) : ownState; // <T> = the component's value type
```

- Replace reads of the controllable value with `currentValue`.
- In the existing change path, route through binding when bound:

```ts
const commit = (next: <T>, event?: <EventType>) => {
  if (bound) bound.onChange(next, event);
  else setOwnState(next);
  onChange?.(next, event); // preserve the existing public onChange call
};
```

- Where the control has a native blur (`TextField`, `Textarea`, `NumberField`, `Select`, `Combobox`, `PinInput`): add/extend `onBlur` to also call `bound?.onBlur()`:

```ts
onBlur={(e) => { bound?.onBlur(); onBlur?.(e); }}
```
  (Add `onBlur` to the destructured props if not already pulled out; it's already part of the spread DOM props for text inputs, so destructure it to avoid double-binding.)

- For `TagInput`, `DatePicker`, `ToggleGroup` (no single blur target): skip `onBlur` wiring; touched is set on submit (and on change for `onChange` mode). This is acceptable per the spec.

Per-component value types (`<T>`) and state-variable names (from the current source):

| Component | value type `<T>` | controllable tuple | notes |
|---|---|---|---|
| TextField | `string` | `state`/`setState` | empty fallback `''` |
| Textarea | `string` | `state`/`setState` | empty `''` |
| NumberField | `number \| null` | (inspect file) | empty fallback `null` |
| Select | `string \| undefined` | `selected`/`setSelected` | |
| Combobox | `string \| undefined` | `selected`/`setSelected` | |
| TagInput | `string[]` | `tags`/`setTags` | empty `[]`; no onBlur |
| PinInput | `string` | `val`/`setVal` | empty `''` |
| DatePicker | `Date \| undefined` | `selected`/`setSelected` | no onBlur |
| ToggleGroup | `string \| string[]` | `selected`/`setSelected` | no onBlur |

### Reference implementation: TextField (do this one fully, exactly)

- [ ] **Step 1: Write the failing test** (append to `src/components/TextField/TextField.test.tsx`)

```tsx
// add imports at top
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { FormField } from '../FormField';

describe('TextField bound to a Form', () => {
  it('reads its value from the form and writes changes back', () => {
    function Wrap() {
      const form = useForm({ defaultValues: { email: 'a@b.com' } });
      return (
        <Form form={form} aria-label="f">
          <FormField name="email" label="Email">
            <TextField />
          </FormField>
        </Form>
      );
    }
    render(<Wrap />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.value).toBe('a@b.com');
    fireEvent.change(input, { target: { value: 'c@d.com' } });
    expect(input.value).toBe('c@d.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TextField/TextField.test.tsx`
Expected: FAIL — bound input value stays empty (binding not consumed yet).

- [ ] **Step 3: Edit `src/components/TextField/TextField.tsx`**

Add `onBlur` to the destructured props (in the param list, near `onChange`): include `onBlur,`.

Replace the controllable-state block + input wiring. The current code is:

```tsx
    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });
```
becomes:
```tsx
    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? ((bound.value as string) ?? '') : state;
```

And the `<input>`'s `value`/`onChange` (currently `value={state}` and the `onChange` handler) become:
```tsx
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
            onBlur={(event) => {
              bound?.onBlur();
              onBlur?.(event);
            }}
            {...props}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/TextField/TextField.test.tsx`
Expected: PASS (existing + new bound test).

- [ ] **Step 5: Commit**

```bash
git add src/components/TextField/TextField.tsx src/components/TextField/TextField.test.tsx
git commit --no-verify -m "feat(form): TextField consumes FormField binding (#38)"
```

### Remaining 8 inputs (repeat the transformation per the table)

For **each** of `Textarea`, `NumberField`, `Select`, `Combobox`, `TagInput`, `PinInput`, `DatePicker`, `ToggleGroup`:

- [ ] **Step A:** Append a bound-to-Form test mirroring the TextField test, using that input's value type and an appropriate query (label text), asserting the bound value renders and a change/selection writes back through the form. For inputs without a visible text value (Select/Combobox/ToggleGroup/DatePicker), assert via a sibling probe reading `form.getValues()` or the option's selected state.
- [ ] **Step B:** Run the test, verify it FAILS.
- [ ] **Step C:** Apply the uniform transformation (binding override of value + change routing + onBlur where applicable) using the variable names in the table.
- [ ] **Step D:** Run the test, verify it PASSES; also run the full file to confirm no standalone regressions: `npx vitest run src/components/<Name>/<Name>.test.tsx`.
- [ ] **Step E:** Commit: `git commit --no-verify -m "feat(form): <Name> consumes FormField binding (#38)"`.

> If using parallel subagents, each input is an independent worktree task. Each agent runs `npx lint-staged` manually before committing with `--no-verify` (Windows husky-spawn gotcha), and the integrator unlocks + removes worktrees and deletes `worktree-agent-*` branches after the octopus-merge.

---

## Task 8: `useFieldArray`

**Files:**
- Create: `src/components/Form/useFieldArray.ts`
- Test: `src/components/Form/useFieldArray.test.tsx`

Manages a repeating array field. Keeps a parallel array of stable ids for React keys.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/useFieldArray.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { useFieldArray } from './useFieldArray';
import type { FormApi } from './useForm';

let api!: FormApi;
function List() {
  const arr = useFieldArray('items');
  return (
    <div>
      <span data-testid="count">{arr.fields.length}</span>
      <span data-testid="ids">{arr.fields.map((f) => f.id).join(',')}</span>
      <button onClick={() => arr.append({ title: 'x' })}>append</button>
      <button onClick={() => arr.remove(0)}>remove0</button>
      <button onClick={() => arr.move(0, 1)}>move</button>
    </div>
  );
}
function Wrap({ defaults }: { defaults?: unknown[] }) {
  api = useForm({ defaultValues: { items: defaults ?? [] } });
  return <Form form={api} aria-label="f"><List /></Form>;
}

describe('useFieldArray', () => {
  it('appends items and assigns stable unique ids', () => {
    render(<Wrap />);
    fireEvent.click(screen.getByText('append'));
    fireEvent.click(screen.getByText('append'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    const ids = screen.getByTestId('ids').textContent!.split(',');
    expect(ids[0]).not.toBe(ids[1]);
    expect(api.getValues().items).toEqual([{ title: 'x' }, { title: 'x' }]);
  });

  it('removes by index', () => {
    render(<Wrap defaults={[{ title: 'a' }, { title: 'b' }]} />);
    fireEvent.click(screen.getByText('remove0'));
    expect(api.getValues().items).toEqual([{ title: 'b' }]);
  });

  it('moves items', () => {
    render(<Wrap defaults={[{ title: 'a' }, { title: 'b' }]} />);
    fireEvent.click(screen.getByText('move'));
    expect(api.getValues().items).toEqual([{ title: 'b' }, { title: 'a' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/useFieldArray.test.tsx`
Expected: FAIL — cannot resolve `./useFieldArray`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/Form/useFieldArray.ts
import { useRef, useSyncExternalStore } from 'react';
import { get } from './path';
import { useFormContext } from './FormContext';

export interface FieldArrayItem {
  id: string;
}

export interface UseFieldArrayResult<T = Record<string, unknown>> {
  fields: Array<T & FieldArrayItem>;
  append: (value: T) => void;
  prepend: (value: T) => void;
  insert: (index: number, value: T) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  replace: (values: T[]) => void;
}

let arrayItemCounter = 0;
function nextId(): string {
  arrayItemCounter += 1;
  return `fa_${arrayItemCounter}`;
}

export function useFieldArray<T = Record<string, unknown>>(
  name: string,
): UseFieldArrayResult<T> {
  const api = useFormContext();
  const idsRef = useRef<string[]>([]);

  const values = useSyncExternalStore(
    api.subscribe,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
  );

  // Keep the id list length in sync with the value array length.
  while (idsRef.current.length < values.length) idsRef.current.push(nextId());
  if (idsRef.current.length > values.length) {
    idsRef.current = idsRef.current.slice(0, values.length);
  }

  const fields = values.map((v, i) => ({ ...(v as object), id: idsRef.current[i]! })) as Array<
    T & FieldArrayItem
  >;

  const write = (next: T[], nextIds: string[]) => {
    idsRef.current = nextIds;
    api.setValue(name, next);
  };

  return {
    fields,
    append(value) {
      write([...values, value], [...idsRef.current, nextId()]);
    },
    prepend(value) {
      write([value, ...values], [nextId(), ...idsRef.current]);
    },
    insert(index, value) {
      const next = values.slice();
      next.splice(index, 0, value);
      const ids = idsRef.current.slice();
      ids.splice(index, 0, nextId());
      write(next, ids);
    },
    remove(index) {
      const next = values.slice();
      next.splice(index, 1);
      const ids = idsRef.current.slice();
      ids.splice(index, 1);
      write(next, ids);
    },
    move(from, to) {
      const next = values.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item as T);
      const ids = idsRef.current.slice();
      const [movedId] = ids.splice(from, 1);
      ids.splice(to, 0, movedId!);
      write(next, ids);
    },
    replace(nextValues) {
      write(nextValues, nextValues.map(() => nextId()));
    },
  };
}

const EMPTY: never[] = [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/useFieldArray.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/useFieldArray.ts src/components/Form/useFieldArray.test.tsx
git commit --no-verify -m "feat(form): add useFieldArray (#38)"
```

---

## Task 9: `<FormErrorSummary>`

**Files:**
- Create: `src/components/Form/FormErrorSummary.tsx`
- Create: `src/components/Form/FormErrorSummary.module.css`
- Test: `src/components/Form/FormErrorSummary.test.tsx`

An accessible region listing current errors; each entry links to and focuses its field.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/FormErrorSummary.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { FormErrorSummary } from './FormErrorSummary';
import { FormField } from '../FormField';
import { TextField } from '../TextField';

function Wrap() {
  const form = useForm({
    resolver: async (v) => ({
      values: v,
      errors: {
        ...(v.email ? {} : { email: 'Email required' }),
        ...(v.name ? {} : { name: 'Name required' }),
      },
    }),
  });
  return (
    <Form form={form} aria-label="f">
      <FormErrorSummary heading="Fix these" />
      <FormField name="name" label="Name"><TextField /></FormField>
      <FormField name="email" label="Email"><TextField /></FormField>
      <button type="submit">Go</button>
    </Form>
  );
}

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    render(<Wrap />);
    expect(screen.queryByText('Fix these')).not.toBeInTheDocument();
  });

  it('lists errors after a failed submit and focuses a field on link click', async () => {
    render(<Wrap />);
    fireEvent.click(screen.getByText('Go'));
    expect(await screen.findByText('Fix these')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Email required' });
    fireEvent.click(link);
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Form/FormErrorSummary.test.tsx`
Expected: FAIL — cannot resolve `./FormErrorSummary`.

- [ ] **Step 3: Write minimal implementation**

```css
/* src/components/Form/FormErrorSummary.module.css */
.root {
  border: 1px solid var(--ku-color-danger-border, var(--ku-color-border-default));
  border-radius: var(--ku-radius-md);
  padding: var(--ku-space-3) var(--ku-space-4);
  margin-block-end: var(--ku-space-4);
  color: var(--ku-color-danger-fg, var(--ku-color-fg-default));
  background: var(--ku-color-danger-bg-subtle, transparent);
}
.heading {
  margin: 0 0 var(--ku-space-2);
  font-weight: var(--ku-font-weight-semibold);
}
.list {
  margin: 0;
  padding-inline-start: var(--ku-space-5);
}
.link {
  color: inherit;
}
```

```tsx
// src/components/Form/FormErrorSummary.tsx
import { forwardRef, useSyncExternalStore } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { useFormContext } from './FormContext';
import styles from './FormErrorSummary.module.css';

export interface FormErrorSummaryProps extends HTMLAttributes<HTMLDivElement> {
  /** Heading text for the summary region. */
  heading?: ReactNode;
}

export const FormErrorSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  function FormErrorSummary({ heading = 'There is a problem', className, ...props }, ref) {
    const api = useFormContext();
    const errors = useSyncExternalStore(
      api.subscribe,
      () => api.getSnapshot().errors,
      () => api.getSnapshot().errors,
    );
    const headingId = useId('error-summary');
    const entries = Object.entries(errors);
    if (entries.length === 0) return null;

    return (
      <div
        ref={ref}
        role="alert"
        aria-labelledby={headingId}
        className={cx(styles.root, className)}
        {...props}
      >
        <p id={headingId} className={styles.heading}>
          {heading}
        </p>
        <ul className={styles.list}>
          {entries.map(([name, message]) => {
            const id = api.getFieldId(name);
            return (
              <li key={name}>
                <a
                  className={styles.link}
                  href={id ? `#${id}` : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    api.focusField(name);
                  }}
                >
                  {message}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Form/FormErrorSummary.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/FormErrorSummary.tsx src/components/Form/FormErrorSummary.module.css src/components/Form/FormErrorSummary.test.tsx
git commit --no-verify -m "feat(form): add accessible FormErrorSummary (#38)"
```

---

## Task 10: Integration test

**Files:**
- Create: `src/components/Form/Form.integration.test.tsx`

End-to-end through the real components.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Form/Form.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Form } from './Form';
import { useForm } from './useForm';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';
import { FormField } from '../FormField';
import { TextField } from '../TextField';

function schema(): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate(value: unknown) {
        const v = value as { name?: string; email?: string };
        const issues: { message: string; path: string[] }[] = [];
        if (!v.name) issues.push({ message: 'Name required', path: ['name'] });
        if (!v.email) issues.push({ message: 'Email required', path: ['email'] });
        return issues.length ? { issues } : { value: v };
      },
    },
  };
}

describe('Form integration', () => {
  it('submits valid values and focuses the first invalid field on failure', async () => {
    const onValid = vi.fn();
    function App() {
      const form = useForm({ resolver: standardSchemaResolver(schema()) });
      return (
        <Form form={form} onValid={onValid} aria-label="signup">
          <FormField name="name" label="Name"><TextField /></FormField>
          <FormField name="email" label="Email"><TextField /></FormField>
          <button type="submit">Submit</button>
        </Form>
      );
    }
    render(<App />);

    // Submit empty → invalid, first field focused, no onValid.
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Name required')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    expect(onValid).not.toHaveBeenCalled();

    // Fill both → valid.
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@x.com' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then passes**

Run: `npx vitest run src/components/Form/Form.integration.test.tsx`
Expected: PASS (all earlier tasks implement the behavior; if it fails, fix the underlying task, not the test).

- [ ] **Step 3: Commit**

```bash
git add src/components/Form/Form.integration.test.tsx
git commit --no-verify -m "test(form): end-to-end Form + FormField + TextField integration (#38)"
```

---

## Task 11: Stories + e2e registration

**Files:**
- Create: `src/components/Form/Form.stories.tsx`
- Modify: `e2e/components.spec.ts` (register the `Form` Showcase story)

- [ ] **Step 1: Inspect an existing stories file + the e2e registry** to match conventions exactly.

Run: `npx vitest --version` (sanity) then read `src/components/FormField/FormField.stories.tsx` and `e2e/components.spec.ts` to copy the `meta`/`Showcase` + registration shape.

- [ ] **Step 2: Write `Form.stories.tsx`** with a default `meta` (title `Components/Form`) and at least: a `Login` story (name + email with `standardSchemaResolver`), a `WithErrorSummary` story (FormErrorSummary above the fields), and a `FieldArray` story (useFieldArray add/remove rows). Include a `Showcase` export combining them in one render (both-theme axe target). Use only existing components (`Form`, `FormField`, `TextField`, `Button`, `FormErrorSummary`).

Reference skeleton (fill field bodies to match the Login/array described):

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Form } from './Form';
import { useForm } from './useForm';
import { useFieldArray } from './useFieldArray';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';
import { FormErrorSummary } from './FormErrorSummary';
import { FormField } from '../FormField';
import { TextField } from '../TextField';
import { Button } from '../Button';

const meta: Meta<typeof Form> = { title: 'Components/Form', component: Form };
export default meta;
type Story = StoryObj<typeof Form>;

const required = (fields: string[]): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'demo',
    validate(value) {
      const v = (value ?? {}) as Record<string, unknown>;
      const issues = fields.filter((f) => !v[f]).map((f) => ({ message: `${f} is required`, path: [f] }));
      return issues.length ? { issues } : { value: v };
    },
  },
});

export const Login: Story = {
  render: () => {
    const form = useForm({ resolver: standardSchemaResolver(required(['email', 'password'])) });
    return (
      <Form form={form} onValid={() => alert('ok')} style={{ maxWidth: 360 }}>
        <FormField name="email" label="Email"><TextField type="email" /></FormField>
        <FormField name="password" label="Password"><TextField type="password" /></FormField>
        <Button type="submit">Sign in</Button>
      </Form>
    );
  },
};

// export const WithErrorSummary, export const FieldArray, export const Showcase ...
```

- [ ] **Step 3: Register `Showcase` in `e2e/components.spec.ts`** following the existing list entry shape (component id `form`, story `showcase`). Match the exact pattern already used by neighboring components in that file.

- [ ] **Step 4: Build tokens + run the unit suite to confirm stories compile under vitest's story imports (if applicable).**

Run: `npm run build:tokens` then `npx vitest run src/components/Form`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Form/Form.stories.tsx e2e/components.spec.ts
git commit --no-verify -m "docs(form): add Form stories + register e2e showcase (#38)"
```

---

## Task 12: Public exports + full local gate

**Files:**
- Create: `src/components/Form/index.ts`
- Modify: `src/index.ts` (re-export the Form layer)

- [ ] **Step 1: Write `src/components/Form/index.ts`**

```ts
export { Form } from './Form';
export type { FormProps } from './Form';
export { useForm } from './useForm';
export type {
  FormApi,
  UseFormOptions,
  FieldRules,
  FieldState,
  FormState,
  ValidationMode,
  FormValues,
  FormErrors,
} from './useForm';
export { useFormContext, useOptionalFormContext } from './FormContext';
export { useFormField } from './useFormField';
export type { UseFormFieldResult } from './useFormField';
export { useFieldArray } from './useFieldArray';
export type { UseFieldArrayResult, FieldArrayItem } from './useFieldArray';
export { FormErrorSummary } from './FormErrorSummary';
export type { FormErrorSummaryProps } from './FormErrorSummary';
export { standardSchemaResolver } from './resolver';
export type { Resolver, ResolverResult, StandardSchemaV1 } from './resolver';
```

- [ ] **Step 2: Re-export from `src/index.ts`** — add a `// Form orchestration (#38)` section mirroring the existing export style:

```ts
export {
  Form,
  useForm,
  useFormContext,
  useOptionalFormContext,
  useFormField,
  useFieldArray,
  FormErrorSummary,
  standardSchemaResolver,
} from './components/Form';
export type {
  FormProps,
  FormApi,
  UseFormOptions,
  FieldRules,
  FieldState,
  FormState,
  ValidationMode,
  FormValues,
  FormErrors,
  UseFormFieldResult,
  UseFieldArrayResult,
  FieldArrayItem,
  FormErrorSummaryProps,
  Resolver,
  ResolverResult,
  StandardSchemaV1,
} from './components/Form';
```

Also add `FieldBinding` to the existing FormField type re-export block:

```ts
// in the existing FormField export type { ... } from './components/FormField'; add:
  FieldBinding,
```
And export it from `src/components/FormField/index.ts` (add `FieldBinding` to its `export type { ... } from './useField'`).

- [ ] **Step 3: Run the full local gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
Expected: all green. Fix any failures at their source (do not weaken tests). Common gotchas to watch (from repo memory): `as CSSProperties` for any `--ku-*` inline styles; `noUncheckedIndexedAccess` guards on array index access; DOM-prop collisions resolved via `Omit`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Form/index.ts src/components/FormField/index.ts src/index.ts
git commit --no-verify -m "feat(form): export Form orchestration layer from package entry (#38)"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** useForm+Form (Tasks 3,4) ✓; validation resolver+field-level (Tasks 2,3) ✓; FieldContext binding + name-aware FormField (Task 6) ✓; input auto-wiring (Task 7) ✓; field arrays (Task 8) ✓; error summary (Task 9) ✓; exports (Task 12) ✓; tests + a11y story (Tasks 10,11) ✓. Boolean/choice-input deferral documented in spec → file as follow-up after merge.
- **Type consistency:** `FormApi`, `FieldState`, `FieldRules`, `FieldBinding`, `Resolver`/`ResolverResult`, `UseFormFieldResult`, `UseFieldArrayResult` are defined once and imported elsewhere; `setFieldId`/`getFieldId`/`focusField` used consistently by FormField (Task 6) + FormErrorSummary (Task 9). `standardSchemaResolver` signature matches its consumers.
- **Placeholders:** Task 7's 8 repeated inputs and Task 11's story bodies are intentionally pattern-driven (each input differs only by value type/var names per the table); every other task carries complete code.
