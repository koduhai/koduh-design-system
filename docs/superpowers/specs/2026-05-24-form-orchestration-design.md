# Form orchestration layer (`Form` / `useForm`) — design

**Issue:** [#38](https://github.com/koduhai/koduhai-design-system-v2/issues/38) — Form layer round 2: Form orchestration + validation
**Date:** 2026-05-24
**Status:** Approved (brainstorming) → implementation

## Problem

`FormField` / `useField` give per-field label/error/aria wiring, but there is no
form-level orchestration: nothing owns values, touched/dirty, submission, field
registration, or validation. Real apps need it. This layer adds it **on top of**
the existing field layer with **no breaking changes** to current field-level usage.

## Scope (all four issue items)

1. `useForm` hook + `<Form>` provider — values, touched/dirty, submission, field registration, reset.
2. Validation — pluggable schema resolver (Standard Schema adapter, zero hard dep) + field-level validators; errors surfaced through `FormField`.
3. Field arrays — `useFieldArray` add/remove/insert/move/replace.
4. Accessible form-level error summary — `<FormErrorSummary>` linking to invalid fields (focus on activate).

Out of scope for this batch (documented follow-up): full auto-wiring of the
boolean/choice inputs (Checkbox, Radio/RadioGroup, Switch, Slider, Rating). They
remain fully usable standalone and bind via the `useFormField` escape hatch until
a later batch.

## Key decisions (from brainstorming)

- **Field binding:** controlled, name + context (Formik-style). A name-aware `FormField`
  auto-wires `value`/`onChange`/`onBlur` into our existing controlled inputs.
- **Validation surface:** Standard Schema (`~standard`) + a `resolver` adapter, plus
  per-field validators. No hard dependency on any schema library (zero-runtime-deps policy).
- **Wiring mechanism:** extend `FieldContext` with an optional `binding`; core inputs
  consume it when present (additive). Cleanest consumer API:
  `<Form form={form}><FormField name="email" label="Email"><TextField /></FormField></Form>`.
- **Re-render strategy:** external store + `useSyncExternalStore` so typing in one field
  re-renders only that field, not the whole form.

## Architecture

New self-contained folder `src/components/Form/`. Each layer depends only on layers
below it; consistent with the four-layer architecture in `CLAUDE.md`.

| File | Responsibility |
|---|---|
| `useForm.ts` | Headless core. Creates a `FormApi` (external store: values/errors/touched/dirty/isSubmitting/submitCount) + methods (`setValue`, `setError`, `clearErrors`, `reset`, `handleSubmit`, `register`, `getFieldState`, `getValues`, `subscribe`). |
| `FormContext.ts` | Context carrying the `FormApi`; `useFormContext()` (throws) / `useOptionalFormContext()` (null). |
| `Form.tsx` | `<Form form={api}>` — renders a native `<form>`, wires `onSubmit` → `api.handleSubmit`, provides context. `forwardRef`, `className` passthrough, DOM-prop spread. |
| `useFormField.ts` | `useFormField(name, rules?)` — subscribes to one field's slice via `useSyncExternalStore`; returns `{ value, error, touched, dirty, onChange, onBlur, setValue }`. Named `useFormField` to avoid colliding with FormField's existing headless `useField`. |
| `useFieldArray.ts` | `useFieldArray(name)` → `{ fields, append, prepend, insert, remove, move, replace }`. `fields` is stable-keyed (each item carries an internal `id`). |
| `FormErrorSummary.tsx` | Accessible region listing invalid fields; each entry is a link that focuses the field on activate. Renders nothing when there are no errors. |
| `resolver.ts` | `standardSchemaResolver(schema)` adapter (consumes the Standard Schema `~standard` interface) + the `Resolver` type. |
| `path.ts` | Internal `get`/`set`/`unset` path helpers for nested/array field names (`name.0.field`). No lodash. |
| `index.ts` | Public API + type exports. |

### Re-render strategy

Form state lives in a ref-held store with a subscriber set. `useForm` returns a
stable `FormApi`. `useFormField`/`FormField`/`FormErrorSummary` subscribe to their
slice via `useSyncExternalStore`, so a keystroke in one field re-renders only that
field (and the error summary if it is currently showing errors), not the whole form.

## FieldContext binding & data flow

Extend `FieldContextValue` (additive, optional — standalone usage unchanged):

```ts
export interface FieldBinding {
  name: string;
  value: unknown;
  onChange: (value: unknown, event?: unknown) => void;
  onBlur: () => void;
}
export interface FieldContextValue {
  // existing: id, labelId, describedById, invalid, required
  binding?: FieldBinding;
}
```

`FormField` gains an optional `name` prop. When `name` is set **and** a `<Form>`
ancestor exists, `FormField`:

- subscribes to that field via `useFormField(name)`,
- derives `invalid` / `describedById` from the form's error for that field (so the
  `error` / `errorText` props become optional — the form supplies the message),
- puts `{ name, value, onChange, onBlur }` into `binding`.

With no `name` or no `<Form>`, `FormField` behaves exactly as today.

**Opt-in consumption in inputs** (additive guard; shown for `TextField`):

```ts
const field = useOptionalFieldContext();
const bound = field?.binding;
const value = bound ? (bound.value as string) : state; // state = own useControllableState
const handleChange = (v, e) => { (bound ? bound.onChange(v, e) : setState(v)); onChange?.(v, e); };
const handleBlur = (e) => { bound?.onBlur(); onBlur?.(e); };
```

An explicit `value` prop always wins (escape hatch / override). Wired into the 10
field-context-consuming inputs: **TextField, Textarea, NumberField, Select, Combobox,
TagInput, PinInput, DatePicker, FileUpload, ToggleGroup**.

**Keystroke flow:** input → `bound.onChange(v)` → `api.setValue(name, v)` → store
updates that field's slice + marks dirty → only subscribers to `name` re-render.
Blur → `api.setTouched(name)` → field-level / `onBlur`-mode validation.

## Validation

`useForm` options:

```ts
useForm({
  defaultValues,
  resolver?,                                   // (values) => { values, errors } | Promise — schema-level
  mode?: 'onSubmit' | 'onBlur' | 'onChange',   // default 'onSubmit'
  reValidateMode?: 'onChange' | 'onBlur',      // after first submit, default 'onChange'
});
```

- **Resolver:** `(values) => { values, errors }` (sync or async), where `errors` is a
  flat `Record<name, message>` and `values` is the parsed/coerced output (falls back to
  the input on failure). `standardSchemaResolver(schema)` runs
  `schema['~standard'].validate(values)` and maps issues (by `path`) into that record.
- **Field-level validators:** via `register(name, { validate, required })` or a `rules`
  arg on `useFormField`. Run alongside the resolver; **resolver errors take precedence**
  on conflict (documented).
- Errors surface through `binding` → `FormField` renders them in its existing
  description slot with `aria-invalid` / `aria-describedby`. No new per-field error UI.

## Submission

`handleSubmit(onValid, onInvalid?)`:

1. mark all fields touched → run full validation (resolver + field validators).
2. valid → `await onValid(values)`; `isSubmitting` is `true` during the await.
3. invalid → populate errors, focus the first invalid field, call `onInvalid?(errors)`.

## Field arrays

`useFieldArray(name)` → `{ fields, append, prepend, insert, remove, move, replace }`.
`fields` is a stable-keyed array (each item carries an internal `id` for React keys).
Names compose as `name.${index}.${field}`; nested values resolved via the `path`
helpers.

## Error summary

`<FormErrorSummary>` subscribes to the error map and renders an `aria-labelledby`'d
region containing a list of `<a href="#fieldId">message</a>`. Activating an entry
focuses the corresponding field (`getFieldState(name).ref`). Empty errors → renders
nothing. Stories cover both themes for axe.

## Testing & a11y

**Vitest + Testing Library:**

- `useForm.test.tsx` — values/dirty/touched transitions, `setValue`/`reset`, submit
  valid vs invalid path, `isSubmitting` during async submit, validation modes.
- `resolver.test.ts` — `standardSchemaResolver` against a hand-rolled fake
  Standard-Schema validator (no real zod dep) + an async case.
- `useFieldArray.test.tsx` — append/remove/insert/move/replace keep values + keys aligned.
- `Form.integration.test.tsx` — `<Form>` + `<FormField name>` + real `<TextField>`/
  `<Select>`: typing updates store, blur validates, submit focuses first invalid field,
  error renders through FormField.
- `FormErrorSummary.test.tsx` — lists invalid fields, link click focuses the field,
  renders nothing when valid.
- Regression guard: existing `FormField` / `TextField` standalone tests stay green
  (binding is additive).

**Playwright + axe (both themes):** a `Form` showcase story (login + field-array +
error summary) registered in `e2e/components.spec.ts`. Labelled error-summary region;
focus management verified. Color never the sole signal (error text + `aria-invalid`).

## Public exports

`Form/index.ts` → re-exported from `src/index.ts`:

- **Values:** `Form`, `useForm`, `useFormField`, `useFieldArray`, `FormErrorSummary`,
  `useFormContext`, `standardSchemaResolver`.
- **Types:** `FormApi`, `UseFormOptions`, `FormProps`, `UseFormFieldResult`,
  `UseFieldArrayResult`, `Resolver`, `FieldBinding`, `FormErrorSummaryProps`, and the
  extended `FieldContextValue`.
- `FormField` gains the `name` prop and optional-error additions; `FormFieldProps` updated.

## Non-goals / follow-up

- Auto-wiring binding into Checkbox / Radio / RadioGroup / Switch / Slider / Rating
  (file as a follow-up; they bind via `useFormField` meanwhile).
- No new runtime dependencies. Path helpers are internal.
