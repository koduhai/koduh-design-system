# v2 Issues #9–#15 — Design

**Date:** 2026-05-24
**Branch:** `feat/v2-issues-4-7` (continuing) → ff-merge to `main`
**Issues:** [#9](https://github.com/koduhai/koduhai-design-system-v2/issues/9), [#10](https://github.com/koduhai/koduhai-design-system-v2/issues/10), [#11](https://github.com/koduhai/koduhai-design-system-v2/issues/11), [#13](https://github.com/koduhai/koduhai-design-system-v2/issues/13), [#14](https://github.com/koduhai/koduhai-design-system-v2/issues/14), [#15](https://github.com/koduhai/koduhai-design-system-v2/issues/15). #12 is the umbrella roadmap and stays open.

These follow-ups came from dogfooding `@koduhai/design-system` v2.0.0 in `koduh-console-demo`. They split into: small ergonomics/a11y fixes to existing components (#9, #10, #11), and three new foundational surfaces (#13 layout/typography, #14 notifications, #15 form layer).

All work obeys the established conventions in `CLAUDE.md`: tokens are the single source of truth (components read `--ku-*` CSS variables, never import token values); CSS Modules with **data-attribute** styling (`data-variant`, `data-size`, …); `forwardRef` + spread DOM props to the root; `cx(styles.root, className)`; `asChild` via `Slot` for polymorphism; controlled/uncontrolled via `useControllableState`; the shared tone vocabulary; every public type exported from the component `index.ts` and re-exported from `src/index.ts`. WCAG AA is a hard requirement (axe e2e in dark + light). No new runtime dependencies.

---

## 1. Quick ergonomics — #9, #11

### 1.1 ConfirmDialog confirm semantics (#9.1) — docs only

No behavior change. In `ConfirmDialog.tsx`, the confirm handler calls `onConfirm()` **then** `onOpenChange(false)`. Document this fire order and the implication: a consumer wiring side effects into `onOpenChange` will also run them on the confirm path; confirm-vs-dismiss can be distinguished **only** via `onConfirm`. Add the callout to the ConfirmDialog story docs and `MIGRATION.md`.

### 1.2 `Chip.label` → `ReactNode` (#9.2)

Widen `ChipProps.label` from `string` to `ReactNode`. The delete button's default accessible label currently interpolates the string (`Remove ${label}`); when `label` is not a string, fall back to `"Remove"`. JSDoc on `deleteLabel` notes that consumers should pass an explicit `deleteLabel` when `label` is non-text. No change to the interactive/role logic.

### 1.3 `Dialog` `initialFocus` (#11.1)

Native `<dialog>.showModal()` focuses the first focusable descendant — the header Close button — which is wrong for form dialogs. Add:

```ts
/** Where to send focus when the dialog opens, overriding the native default
 *  (first focusable = the Close button). A ref to an element, or a CSS selector
 *  queried within the dialog. */
initialFocus?: RefObject<HTMLElement> | string;
```

When the dialog opens (the existing `open`-sync effect, after `showModal()`), resolve the target: a ref → `ref.current`; a string → `dialogRef.current?.querySelector(selector)`. If found, `.focus()` it. If `initialFocus` is omitted, keep native behavior. `ConfirmDialog` gains an internal ref on the confirm `Button` and passes it as `initialFocus` by default, so confirm dialogs land focus on the confirm action. (`Button` already forwards `ref` to its `<button>`.)

### 1.4 `Select` `required` (#11.2)

Add `required?: boolean` to `SelectProps`. When set: render the same `*` indicator the label uses in TextField (a trailing `<span aria-hidden> *</span>` inside the label), and set `aria-required` on the trigger button. Visual treatment matches TextField's required indicator (reuse the established `.required` style approach in `Select.module.css`).

### 1.5 Focus-first-invalid (#11.3) — out of scope

The lib won't ship a form engine. The controls already forward `ref` to their focusable element; document the "plumb refs, focus the first invalid on submit" pattern in the form docs. No code.

---

## 2. Breadcrumb composition — #10

**Bug:** `PageHeader` wraps its `breadcrumbs` slot in `<nav aria-label="Breadcrumb">` (`PageHeader.tsx:30`), and `Breadcrumbs` renders its own `<nav aria-label="Breadcrumb">` (`Breadcrumbs.tsx:52`). The natural composition nests two identical landmarks (axe `landmark-unique`).

**Fix:** `PageHeaderProps.breadcrumbs` becomes `BreadcrumbItem[] | ReactNode`.

- **Array** (`BreadcrumbItem[]`): PageHeader renders a single internal `<Breadcrumbs items={breadcrumbs} />` — one nav landmark, no nesting. This is the recommended path.
- **ReactNode**: rendered **without** the wrapping `<nav>`; the passed component (e.g. a `<Breadcrumbs>`) owns its own landmark. Escape hatch for custom trails.

Detection: `Array.isArray(breadcrumbs)`. PageHeader imports `Breadcrumbs` + `BreadcrumbItem` (component → component dependency is acceptable here; PageHeader composing Breadcrumbs is a deliberate, documented composition, not reading internals). Add a documented nested-route pattern (shell-owned breadcrumb source, per-page trail) to the Breadcrumbs story.

---

## 3. Layout + typography — #13 (Core 7)

Seven new self-contained component folders under `src/components/`. All spacing/sizing read CSS variables off the existing scales (`--ku-space-1..12`, `--ku-font-size-*`, `--ku-font-weight-*`, `--ku-line-height-*`, `--ku-breakpoint-*`). Data-attribute styling; `forwardRef`; `className` forwarded; DOM props spread.

### 3.1 Stack / Inline

Flex containers. `Stack` = column, `Inline` = row.

```ts
interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken; // maps to --ku-space-<n>; default e.g. 4
  align?: 'start' | 'center' | 'end' | 'stretch'; // align-items
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'; // justify-content
  wrap?: boolean; // Inline: flex-wrap; Stack: rarely used but allowed
  asChild?: boolean;
}
```

`SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12` (the keys present in `tokens.space`). `gap` is applied via an inline `--stack-gap: var(--ku-space-<n>)` custom property (typed `as CSSProperties`) and consumed by the module CSS, keeping the rule set small. `align`/`justify`/`wrap` are data-attributes selected in CSS.

### 3.2 Grid

```ts
interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: number; // fixed track count: repeat(n, 1fr)
  minItemWidth?: string; // auto-fit: repeat(auto-fit, minmax(minItemWidth, 1fr))
  gap?: SpaceToken;
  asChild?: boolean;
}
```

`columns` and `minItemWidth` are mutually exclusive; `columns` wins if both given (documented). Both drive an inline `--grid-template` custom property consumed by CSS.

### 3.3 Container

```ts
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'; // max-width off --ku-breakpoint-*; default 'lg'
  padded?: boolean; // horizontal padding; default true
  asChild?: boolean;
}
```

Centered (`margin-inline: auto`), `max-width` from the breakpoint token, horizontal padding from a space token.

### 3.4 Text

```ts
interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // --ku-font-size-*; default 'md'
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  tone?: 'default' | 'secondary'; // default → --ku-color-text-primary; secondary → --ku-color-text-secondary
  as?: ElementType; // default 'span'
  asChild?: boolean;
}
```

`tone` maps to the per-theme text color variables that already exist: `default` → `--ku-color-text-primary`, `secondary` → `--ku-color-text-secondary` (both AA-verified in `contrast.test.ts`). There is intentionally **no `muted`/`disabled` tone** — `--ku-color-text-disabled` is below AA for body text, so it is not exposed as a `Text` tone.

### 3.5 Heading

Decouples semantic level from visual size (the heading-scale tension noted in #13).

```ts
interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6; // semantic <h1>..<h6> (renders that tag)
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // visual size; defaults derived from level
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'; // default 'semibold'/'bold'
  asChild?: boolean;
}
```

Reuse the `HeadingLevel` type from `src/utils/headingLevel.ts`. `createElement(\`h${level}\`, …)`like PageHeader. When`size`is omitted, default visual size derives from`level`.

### 3.6 Link

```ts
interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: 'primary' | 'neutral'; // default 'primary'
  underline?: 'always' | 'hover' | 'none'; // default 'hover'
  asChild?: boolean; // render a router <Link> etc.
}
```

Styled `<a>` with accessible `:focus-visible` ring (reuse the focus-ring approach used elsewhere). `asChild` merges props onto a consumer-provided element.

---

## 4. Notification system — #14

A standard imperative toast layer composed over Snackbar's **visuals**. `Snackbar` itself is untouched (stays the controlled primitive).

### 4.1 Store (module singleton)

`src/components/Toaster/store.ts` — a framework-free pub/sub store (react-hot-toast style), so `useToast()` works anywhere without a provider wrapping the tree.

```ts
interface ToastOptions {
  severity?: 'info' | 'success' | 'warning' | 'error'; // default 'info'
  title?: ReactNode;
  description: ReactNode;
  duration?: number; // ms; default per-severity (errors persist longer / until dismissed)
  action?: ReactNode;
}
interface ToastRecord extends Required<Pick<ToastOptions, 'severity'>>, ToastOptions {
  id: string;
}

// store internals
let toasts: ToastRecord[] = [];
const listeners = new Set<(t: ToastRecord[]) => void>();
function emit(): void; // notify listeners
function add(opts: ToastOptions): string; // returns id
function dismiss(id: string): void;
function update(id: string, patch: Partial<ToastOptions>): void;
function subscribe(fn): () => void; // returns unsubscribe
function getSnapshot(): ToastRecord[];
```

### 4.2 `useToast()`

`src/components/Toaster/useToast.ts`:

```ts
function useToast(): {
  toast: ((opts: ToastOptions) => string) & {
    success(d: ReactNode, o?: Omit<ToastOptions,'severity'|'description'>): string;
    error(...): string; warning(...): string; info(...): string;
  };
  dismiss(id: string): void;
  update(id: string, patch: Partial<ToastOptions>): void;
};
```

The hook is a thin, stable wrapper over the store functions (identities stable across renders). It does **not** require `<Toaster>` to be mounted to be called, but toasts only render where a `<Toaster>` is.

### 4.3 `<Toaster>`

`src/components/Toaster/Toaster.tsx`:

```ts
interface ToasterProps {
  placement?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'; // default 'bottom-right'
  max?: number; // max simultaneously visible; default 3 — overflow waits (FIFO)
  gap?: SpaceToken; // spacing between stacked toasts
}
```

Mounted once at the app root. Subscribes to the store via `useSyncExternalStore`. Renders a fixed-position `role="region"` with an accessible name (e.g. `aria-label="Notifications"`) containing the visible toast items, stacked per placement. Each item:

- reuses the Snackbar visual structure (icon by severity, message = title + description, optional action, close button) — share the CSS by importing `Snackbar.module.css` classes or factor a small internal `ToastItem` using the same class names. **Do not** use the Popover top-layer per item (multiple top-layer popovers would not stack predictably); the region is a single fixed-position stacking context with an appropriate z-index.
- `role="status"` + `aria-live="polite"` for info/success/warning; `role="alert"` + `aria-live="assertive"` for error (mirrors Snackbar's severity→role mapping).
- auto-dismiss timer per `duration`; **pause-on-hover / on-focus** (clear timer on enter/focus, restart on leave/blur — the pattern already in `Snackbar.tsx`).
- Esc dismisses the focused toast.

Queue: at most `max` visible; additional toasts wait FIFO and surface as earlier ones dismiss.

### 4.4 Testing notes

Unit tests drive the store directly (add/dismiss/update/max-queue) and render `<Toaster>` asserting role/aria-live, stacking, auto-dismiss (fake timers), and pause-on-hover. The store is module-global: each test resets it (clear toasts) in `beforeEach`.

---

## 5. Form layer — #15

### 5.1 FormField primitive + `useField`

`src/components/FormField/` — a layout + a11y wrapper for **custom** controls (the built-in TextField/Select/Textarea keep self-wiring; FormField standardizes layout + required indicator and makes bespoke controls first-class).

```ts
interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  required?: boolean; // renders the * indicator + marks context.required
  error?: boolean;
  errorText?: ReactNode; // shown when error; replaces helperText (same rule as TextField)
  helperText?: ReactNode;
  id?: string; // base id; control + description ids derive from it
  children: ReactNode; // the control — consumes context via useFieldContext()
}

interface FieldContextValue {
  id: string; // for the control
  describedById?: string; // present when help/error text is shown
  invalid: boolean; // → aria-invalid
  required: boolean;
}
function useFieldContext(): FieldContextValue; // throws if used outside <FormField>
```

FormField renders: a `<label htmlFor={id}>` with the `*` indicator (reusing the established required-indicator markup/style), the `children` (the control), and a description `<p id={describedById}>` carrying help or error text. It provides `FieldContextValue` so a child control can wire `id`, `aria-describedby`, `aria-invalid`, `required`.

`useField` (headless): `src/components/FormField/useField.ts` — for consumers building a control entirely from scratch without the `<FormField>` chrome. Returns `{ fieldProps, labelProps, descriptionProps, controlProps }` given `{ id?, required?, error?, hasDescription? }`. (Thin; documented as the lower-level escape hatch.)

### 5.2 NumberField

`src/components/NumberField/` — numeric input with steppers. Self-wires label/error/required like TextField (consistent with the existing form-control convention).

```ts
interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null, event?: React.SyntheticEvent) => void; // null = empty
  min?: number;
  max?: number;
  step?: number; // default step 1
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  errorText?: ReactNode;
}
```

`<input inputmode="numeric">` with increment/decrement buttons (`aria-label` "Increment"/"Decrement"). Arrow Up/Down adjust by `step`; clamp to `min`/`max`; respect `step`. Empty input reports `null`. `aria-invalid`/`aria-describedby` wired like TextField. Buttons disabled at bounds.

### 5.3 Slider

`src/components/Slider/` — single-value range slider, WAI-ARIA slider pattern.

```ts
interface SliderProps {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number; // defaults 0 / 100 / 1
  size?: 'sm' | 'md';
  disabled?: boolean;
  formatValue?: (v: number) => string; // for the visible/aria value text
  id?: string;
  className?: string;
}
```

`role="slider"` thumb with `aria-valuemin/max/now` and `aria-valuetext` (via `formatValue`), `aria-labelledby` → the visible label. Keyboard: Arrow Left/Down −step, Arrow Right/Up +step, Home → min, End → max, PageUp/PageDown → larger step. Pointer drag updates value (clamped + snapped to step). `useControllableState`. Track fill + thumb styled via data-attrs and an inline `--slider-pct`.

### 5.4 TagInput

`src/components/TagInput/` — multi-value token input; renders existing `Chip`s for tokens.

```ts
interface TagInputProps {
  label: ReactNode;
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  max?: number; // cap token count
  allowDuplicates?: boolean; // default false
  size?: 'sm' | 'md';
  required?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  errorText?: ReactNode;
  id?: string;
  className?: string;
}
```

A bordered field containing rendered `Chip`s (each with `onDelete`) followed by a text `<input>`. Enter or comma commits the current text as a tag (trim, dedupe unless `allowDuplicates`, enforce `max`); Backspace on an empty input removes the last tag. `useControllableState` over `string[]`. a11y: input labelled by the field label; removing a tag returns focus to the input; an `aria-live` region announces add/remove. `aria-invalid`/described-by wired like TextField.

### 5.5 Combobox

`src/components/Combobox/` — searchable **single-select** (Select stays click-only). WAI-ARIA combobox (listbox popup) pattern.

```ts
interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ComboboxProps {
  label: ReactNode;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: React.SyntheticEvent) => void;
  placeholder?: string;
  filter?: (option: ComboboxOption, query: string) => boolean; // default: case-insensitive label contains
  noResultsText?: ReactNode; // default 'No results'
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  errorText?: ReactNode;
  id?: string;
  className?: string;
}
```

Editable `<input role="combobox" aria-autocomplete="list" aria-expanded aria-controls>` over a filtered `role="listbox"` rendered in a `Popover` (matching Select's floating approach). Typing filters options; ArrowDown/Up move `aria-activedescendant`; Enter selects the active option; Esc closes; selecting sets the input text to the option label and reports `onChange`. Self-wires label/error/required. Multi-select is explicitly out of scope this batch.

### 5.6 Deferred

**DatePicker/Calendar** and **FileUpload/Dropzone** are deferred to their own spec — each is large (a full calendar grid with month nav + keyboard date-grid a11y; drag-drop file handling with progress/validation). #12 (gap-analysis umbrella) stays open and links them.

---

## 6. Build mechanics & integration

Per the proven parallel workflow:

- **13 new component folders** → one subagent each, in parallel, TDD: `Stack`, `Inline`, `Grid`, `Container`, `Text`, `Heading`, `Link`, `Toaster` (store + useToast + Toaster + ToastItem), `FormField` (FormField + useField), `NumberField`, `Slider`, `TagInput`, `Combobox`. Each agent builds **only** its own `src/components/<Name>/` folder (`Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`, `index.ts`) and runs **only** its own `npx vitest run <file>`. Agents do **not** edit shared files (`src/index.ts`, `e2e/components.spec.ts`, README), run git, or run project-wide typecheck/lint/build.
- **4 surgical modifications** to existing components, done by the integration (parent) session (they touch existing folders + need care, and some interrelate): `Chip` (label→ReactNode), `Dialog`+`ConfirmDialog` (initialFocus), `Select` (required), `PageHeader` (breadcrumbs items[] + import Breadcrumbs). Each TDD'd.
- **Integration session** then: wires `src/index.ts` exports + the e2e `COMPONENTS` array, updates README status block + `MIGRATION.md` (ConfirmDialog semantics + new components), runs the FULL gate (`typecheck`, `lint`, `test`, `build`, `test:e2e` axe + visual in dark + light), regenerates visual baselines (gitignored — not committed), makes per-component + integration commits, then branch + ff-merge to `main`. Publish/tag/push remains maintainer-triggered.

**Known typecheck traps to fix at integration** (from prior phases): DOM-prop collisions need `Omit` (e.g. `size`, `title`, `onChange`); `noUncheckedIndexedAccess` makes array indexing `T | undefined` (guard or `!` after a length check); `--ku-*` inline style objects need `as CSSProperties`; there is no `react-hooks/exhaustive-deps` rule (effects intentionally keyed narrowly).

**a11y rules to honor in stories** (don't disable rules): `landmark-unique` fires when a Showcase repeats identical landmarks — give repeated regions distinct `aria-label`s. Real contrast failures get fixed in the component, never by disabling the rule. The e2e readiness gate uses `expect(page.locator('#storybook-root > *').first()).toBeAttached()` (not text-based).

---

## 7. Out of scope

- DatePicker/Calendar, FileUpload/Dropzone (#15 — deferred to own spec).
- Form-level focus-first-invalid utility (#11.3 — documented pattern only).
- Box / Spacer layout primitives (#13 — Stack `gap` covers Spacer; a style-prop Box is deferred).
- Multi-select Combobox (#15 — single-select only this batch; TagInput covers multi-value entry).
- Everything else in the #12 roadmap (P2 components, density modes, virtualization, RTL audit, etc.).
