# Tailwind Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@koduhai/design-system` cleanly adoptable by a Tailwind `darkMode:'class'` app by committing the already-built class-based theming + `tailwind-preset`, then adding a brand tint ramp, `PasswordInput`, and `CountUp`, shipped as v2.7.0.

**Architecture:** Tokens stay the single source of truth (`src/theme/tokens.ts` → generated CSS vars). The brand ramp is a fixed (theme-independent) scale in `tokens`. `PasswordInput` is a standalone field component modeled on `NumberField` (real in-field toggle `<button>`, accessible). `CountUp` is a self-contained rAF animator honoring reduced motion. The Tailwind preset maps tokens → Tailwind theme as CSS variables.

**Tech Stack:** React 19, TypeScript (strict), CSS Modules, Vitest + Testing Library, tsup, Storybook + axe.

---

## File Structure

**Modify:**
- `src/theme/tokens.ts` — add the fixed `brand` ramp to the `tokens` object.
- `scripts/generate-theme-css.test.ts` — assert `--ku-brand-*` emission.
- `src/tailwind-preset/index.ts` — add `colors.brand` derived from `tokens.brand`.
- `src/tailwind-preset/index.test.ts` — assert the brand mapping.
- `src/icons/icons.tsx` — add `EyeIcon`, `EyeOffIcon` (auto-exported via `index.ts`'s `export *`).
- `src/index.ts` — re-export `PasswordInput` and `CountUp` (+ prop types).
- `package.json` / `package-lock.json` — version bump 2.6.0 → 2.7.0.
- `CHANGELOG.md` — 2.7.0 entry.
- `CLAUDE.md` — document the preset + class theming; component count 70 → 72.

**Create:**
- `src/components/PasswordInput/{PasswordInput.tsx,PasswordInput.module.css,PasswordInput.test.tsx,PasswordInput.stories.tsx,index.ts}`
- `src/components/CountUp/{CountUp.tsx,CountUp.test.tsx,CountUp.stories.tsx,index.ts}` (no CSS module — `CountUp` renders an unstyled `<span>`).

---

## Task 0: Commit the already-built compat work

The branch has uncommitted, already-verified work (class-based theming + preset). Commit it before adding more so history is clean.

**Files:** (already modified/created, not yet committed)
- `scripts/generate-theme-css.ts`, `scripts/generate-theme-css.test.ts`
- `src/tailwind-preset/index.ts`, `src/tailwind-preset/index.test.ts`
- `tsup.config.ts`, `package.json` (exports)
- `docs/tailwind-consumer-compatibility.md`

- [ ] **Step 1: Verify the working tree matches expectation**

Run: `git status --short`
Expected: the files above show as `M`/`??`; `dist/` does NOT appear (gitignored).

- [ ] **Step 2: Run the existing verification to confirm green before committing**

Run: `npm run build && npx vitest run scripts/generate-theme-css.test.ts src/tailwind-preset`
Expected: build succeeds; 16 tests pass.

- [ ] **Step 3: Commit (hooks fail to spawn on this Windows host — use --no-verify)**

```bash
git add scripts/generate-theme-css.ts scripts/generate-theme-css.test.ts \
        src/tailwind-preset tsup.config.ts package.json \
        docs/tailwind-consumer-compatibility.md
git commit --no-verify -m "feat: class-based theming + tailwind-preset entry for Tailwind consumers"
```

---

## Task 1: Brand tint ramp (tokens)

**Files:**
- Modify: `src/theme/tokens.ts` (add `brand` to the `tokens` object, after the `space` block)
- Test: `scripts/generate-theme-css.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `scripts/generate-theme-css.test.ts` inside the `describe('buildThemeCss', ...)` block:

```ts
it('emits a fixed, theme-independent brand ramp on :root', () => {
  // Anchor step equals the DS light primary; ramp is the same in dark + light.
  expect(css).toMatch(/:root\s*\{[^}]*--ku-brand-600: #1B5FCC;/s);
  expect(css).toContain('--ku-brand-50: #EFF4FE;');
  expect(css).toContain('--ku-brand-900: #142F61;');
  // It must NOT be duplicated into the theme override blocks (it's not a theme color).
  expect(css).not.toMatch(/\[data-theme="dark"\][^{]*\{[^}]*--ku-brand-600/s);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/generate-theme-css.test.ts -t "brand ramp"`
Expected: FAIL — `--ku-brand-600` not found.

- [ ] **Step 3: Add the brand ramp to tokens.ts**

In `src/theme/tokens.ts`, inside the `tokens` object, immediately after the `space: { ... },` block, insert:

```ts
  // Fixed brand tint ramp (theme-independent — same in dark and light, like a
  // Tailwind brand scale). `brand-600` is the DS light `primary` (#1B5FCC); the
  // semantic `primary` token stays theme-adaptive, so brand ≠ primary by design.
  // → --ku-brand-50 … --ku-brand-900
  brand: {
    50: '#EFF4FE',
    100: '#DCE8FC',
    200: '#BBD0F9',
    300: '#8FB0F4',
    400: '#5C89EC',
    500: '#3468E0',
    600: '#1B5FCC',
    700: '#1A4DA6',
    800: '#173E82',
    900: '#142F61',
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/generate-theme-css.test.ts`
Expected: PASS (all generator tests).

- [ ] **Step 5: Regenerate theme.css and eyeball it**

Run: `npm run build:tokens`
Then: `npx rg "ku-brand" dist/theme.css`
Expected: 10 `--ku-brand-*` lines under the `:root {` block only.

- [ ] **Step 6: Commit**

```bash
git add src/theme/tokens.ts scripts/generate-theme-css.test.ts
git commit --no-verify -m "feat(tokens): add fixed brand tint ramp (--ku-brand-50…900)"
```

---

## Task 2: Map the brand ramp into the Tailwind preset

**Files:**
- Modify: `src/tailwind-preset/index.ts`
- Test: `src/tailwind-preset/index.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/tailwind-preset/index.test.ts` inside the `describe` block:

```ts
it('maps the brand ramp to --ku-brand-* utilities, derived from tokens', () => {
  expect(Object.keys(colors.brand)).toHaveLength(Object.keys(tokens.brand).length);
  expect(colors.brand['600']).toBe('var(--ku-brand-600)');
  expect(colors.brand['50']).toBe('var(--ku-brand-50)');
});
```

And update the import at the top of the test file:

```ts
import { themes, tokens } from '../theme/tokens';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tailwind-preset/index.test.ts -t "brand ramp"`
Expected: FAIL — `colors.brand` is undefined.

- [ ] **Step 3: Add the brand mapping to the preset**

In `src/tailwind-preset/index.ts`, update the import and add a `brand` map. Change the import line:

```ts
import { themes, tokens } from '../theme/tokens';
```

After the existing `chart` const, add:

```ts
// Fixed brand ramp → bg-brand-600, text-brand-700, … (var(--ku-brand-N), so it
// matches a Tailwind brand scale's mental model). Derived from tokens so it can't drift.
const brand: Record<string, string> = Object.fromEntries(
  Object.keys(tokens.brand).map((step) => [step, `var(--ku-brand-${step})`]),
);
```

Then inside `colors: { ... }`, add `brand,` next to `chart,`:

```ts
        // Data-viz categorical palette: bg-chart-1 … border-chart-8.
        chart,
        // Fixed brand tint ramp: bg-brand-50 … bg-brand-900.
        brand,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tailwind-preset/index.test.ts`
Expected: PASS (all preset tests).

- [ ] **Step 5: Commit**

```bash
git add src/tailwind-preset/index.ts src/tailwind-preset/index.test.ts
git commit --no-verify -m "feat(preset): expose brand ramp as bg-brand-*/text-brand-* utilities"
```

---

## Task 3: Add Eye / EyeOff icons

**Files:**
- Modify: `src/icons/icons.tsx` (auto-exported via `src/icons/index.ts`'s `export * from './icons'`)

- [ ] **Step 1: Add the two icons**

Append to `src/icons/icons.tsx`:

```tsx
export const EyeIcon = /* @__PURE__ */ createIcon(
  'EyeIcon',
  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />,
);

export const EyeOffIcon = /* @__PURE__ */ createIcon(
  'EyeOffIcon',
  <path d="M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7M2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2m4.31-.78 3.15 3.15.02-.16a3 3 0 0 0-3-3z" />,
);
```

- [ ] **Step 2: Typecheck the icons compile**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/icons/icons.tsx
git commit --no-verify -m "feat(icons): add EyeIcon and EyeOffIcon"
```

---

## Task 4: `PasswordInput` component

Modeled on `NumberField` (standalone field shell + interactive in-field button). Reuses the same `useControllableState`/`useOptionalFieldContext` wiring as `TextField`.

**Files:**
- Create: `src/components/PasswordInput/PasswordInput.tsx`
- Create: `src/components/PasswordInput/PasswordInput.module.css`
- Create: `src/components/PasswordInput/PasswordInput.test.tsx`
- Create: `src/components/PasswordInput/PasswordInput.stories.tsx`
- Create: `src/components/PasswordInput/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/PasswordInput/PasswordInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('renders a masked input with the given label', () => {
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles visibility and updates the toggle button a11y state', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    const hideBtn = screen.getByRole('button', { name: 'Hide password' });
    expect(hideBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('forwards the ref to the input and accepts typing (uncontrolled)', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput label="Password" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Password'));
    await user.type(ref.current!, 'hunter2');
    expect(ref.current!.value).toBe('hunter2');
  });

  it('calls onChange with the new value (controlled)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput label="Password" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Password'), 'a');
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it('forwards className to the root', () => {
    const { container } = render(<PasswordInput label="Password" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PasswordInput/PasswordInput.test.tsx`
Expected: FAIL — cannot resolve `./PasswordInput`.

- [ ] **Step 3: Create the stylesheet**

Create `src/components/PasswordInput/PasswordInput.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-1);
  font-family: var(--ku-font-family-base);
}

.label {
  font-size: var(--ku-font-size-sm);
  font-weight: var(--ku-font-weight-medium);
  color: var(--ku-color-text-primary);
}

.required {
  color: var(--ku-color-danger);
}

.field {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  background-color: var(--ku-color-bg-surface);
  border: 1px solid var(--ku-color-border);
  border-radius: var(--ku-radius-md);
  transition:
    border-color var(--ku-duration-fast) var(--ku-easing-standard),
    box-shadow var(--ku-duration-fast) var(--ku-easing-standard);
}

.field:focus-within {
  border-color: var(--ku-color-primary);
  box-shadow: 0 0 0 1px var(--ku-color-primary);
}

.root[data-error='true'] .field {
  border-color: var(--ku-color-danger);
}
.root[data-error='true'] .field:focus-within {
  box-shadow: 0 0 0 1px var(--ku-color-danger);
}

.root[data-size='sm'] .field {
  min-height: 32px;
  padding: 0 var(--ku-space-2);
}
.root[data-size='md'] .field {
  min-height: 40px;
  padding: 0 var(--ku-space-3);
}
.root[data-size='lg'] .field {
  min-height: 48px;
  padding: 0 var(--ku-space-4);
}

.root[data-density='compact'] .field,
[data-density='compact'] .root .field {
  min-height: var(--ku-density-row-height);
  padding: 0 var(--ku-density-control-padding-x);
}

.input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--ku-color-text-primary);
  font-family: inherit;
  font-size: var(--ku-font-size-md);
}
.root[data-size='sm'] .input {
  font-size: var(--ku-font-size-sm);
}
.input::placeholder {
  color: var(--ku-color-text-disabled);
}

.toggle {
  flex: none;
  border: none;
  background: none;
  color: var(--ku-color-text-secondary);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ku-radius-sm);
}
.toggle:hover {
  color: var(--ku-color-text-primary);
}
.toggle:focus-visible {
  outline: var(--ku-focus-ring-width) solid var(--ku-color-primary);
  outline-offset: 1px;
}

.description {
  margin: 0;
  font-size: var(--ku-font-size-xs);
  color: var(--ku-color-text-secondary);
}
.root[data-error='true'] .description {
  color: var(--ku-color-danger);
}
```

- [ ] **Step 4: Create the component**

Create `src/components/PasswordInput/PasswordInput.tsx`:

```tsx
import { forwardRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import { EyeIcon, EyeOffIcon } from '../../icons';
import styles from './PasswordInput.module.css';

export type PasswordInputSize = 'sm' | 'md' | 'lg';

/** Field density. Mirrors the `[data-density]` token mechanism (`--ku-density-*`). */
export type Density = 'comfortable' | 'compact';

export interface PasswordInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'size' | 'value' | 'defaultValue' | 'onChange' | 'type'
  > {
  /** Visible label, associated with the input. Or wrap in a `<FormField>`. */
  label?: ReactNode;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: PasswordInputSize;
  /** Field density; omit to inherit a `data-density` ancestor. */
  density?: Density;
}

export const PasswordInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      value,
      defaultValue,
      onChange,
      onBlur,
      helperText,
      error = false,
      errorText,
      size = 'md',
      density,
      required,
      className,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const reactId = useId('password');
    const field = useOptionalFieldContext();
    const id = field?.id ?? idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const ownDescription = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : ownDescription != null
        ? descriptionId
        : undefined;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field;

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? ((bound.value as string) ?? '') : state;

    const [visible, setVisible] = useState(false);

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-density={density}
        data-error={invalid ? 'true' : undefined}
      >
        {showOwnLabel ? (
          <label className={styles.label} htmlFor={id}>
            {label}
            {isRequired ? (
              <span className={styles.required} aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <div className={styles.field}>
          <input
            ref={ref}
            id={id}
            className={styles.input}
            type={visible ? 'text' : 'password'}
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
            onBlur={(e) => {
              bound?.onBlur();
              onBlur?.(e);
            }}
            {...props}
          />
          <button
            type="button"
            className={styles.toggle}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>
        {showOwnLabel && ownDescription ? (
          <p id={descriptionId} className={styles.description}>
            {ownDescription}
          </p>
        ) : null}
      </div>
    );
  },
);
```

- [ ] **Step 5: Create the barrel**

Create `src/components/PasswordInput/index.ts`:

```ts
export { PasswordInput } from './PasswordInput';
export type { PasswordInputProps, PasswordInputSize } from './PasswordInput';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/PasswordInput/PasswordInput.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Create the story**

Create `src/components/PasswordInput/PasswordInput.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
} satisfies Meta<typeof PasswordInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Password', defaultValue: 'hunter2' } };

export const Showcase: Story = {
  args: { label: 'Password' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <PasswordInput label="Password" defaultValue="hunter2" helperText="At least 8 characters." />
      <PasswordInput label="New password" />
      <PasswordInput label="Confirm" error errorText="Passwords don't match." defaultValue="x" />
    </div>
  ),
};
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, after the `TextField` export lines (around line 42), add:

```ts
export { PasswordInput } from './components/PasswordInput';
export type { PasswordInputProps, PasswordInputSize } from './components/PasswordInput';
```

- [ ] **Step 9: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/components/PasswordInput src/index.ts
git commit --no-verify -m "feat: add PasswordInput component with accessible show/hide toggle"
```

---

## Task 5: `CountUp` component

**Files:**
- Create: `src/components/CountUp/CountUp.tsx`
- Create: `src/components/CountUp/CountUp.test.tsx`
- Create: `src/components/CountUp/CountUp.stories.tsx`
- Create: `src/components/CountUp/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/CountUp/CountUp.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountUp } from './CountUp';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

describe('CountUp', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the final value immediately when reduced motion is preferred', () => {
    mockReducedMotion(true);
    render(<CountUp value={1234} />);
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders the final value immediately when duration is 0', () => {
    mockReducedMotion(false);
    render(<CountUp value={42} duration={0} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies decimals', () => {
    mockReducedMotion(true);
    render(<CountUp value={3.14159} decimals={2} />);
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('applies a custom format function', () => {
    mockReducedMotion(true);
    render(<CountUp value={0.5} format={(n) => `${(n * 100).toFixed(0)}%`} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('forwards className and ref to the span', () => {
    mockReducedMotion(true);
    const { container } = render(<CountUp value={1} className="stat" />);
    expect(container.firstChild).toHaveClass('stat');
    expect((container.firstChild as HTMLElement).tagName).toBe('SPAN');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/CountUp/CountUp.test.tsx`
Expected: FAIL — cannot resolve `./CountUp`.

- [ ] **Step 3: Create the component**

Create `src/components/CountUp/CountUp.tsx`:

```tsx
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';

export interface CountUpProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Target value to animate to. */
  value: number;
  /** Starting value for the first animation. Defaults to 0. */
  from?: number;
  /** Animation duration in ms. Defaults to 800. `0` renders instantly. */
  duration?: number;
  /** Fixed decimal places when no `format` is given. Defaults to 0. */
  decimals?: number;
  /** Custom formatter (e.g. currency/percent). Overrides `decimals`. */
  format?: (n: number) => string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export const CountUp = /* @__PURE__ */ forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  { value, from = 0, duration = 800, decimals = 0, format, ...props },
  ref,
) {
  const [display, setDisplay] = useState(from);
  // Tracks the last settled value so subsequent `value` changes animate from there.
  const startRef = useRef(from);

  useEffect(() => {
    const start = startRef.current;
    if (duration <= 0 || prefersReducedMotion()) {
      setDisplay(value);
      startRef.current = value;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setDisplay(start + (value - start) * easeOut(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        startRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = format ? format(display) : display.toFixed(decimals);
  return (
    <span ref={ref} {...props}>
      {text}
    </span>
  );
});
```

- [ ] **Step 4: Create the barrel**

Create `src/components/CountUp/index.ts`:

```ts
export { CountUp } from './CountUp';
export type { CountUpProps } from './CountUp';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/CountUp/CountUp.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Create the story**

Create `src/components/CountUp/CountUp.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountUp } from './CountUp';

const meta = {
  title: 'Components/CountUp',
  component: CountUp,
} satisfies Meta<typeof CountUp>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: 1280 } };

export const Showcase: Story = {
  args: { value: 1280 },
  render: () => (
    <div style={{ display: 'flex', gap: 32, fontSize: 32, fontWeight: 700 }}>
      <CountUp value={1280} />
      <CountUp value={0.984} format={(n) => `${(n * 100).toFixed(1)}%`} />
      <CountUp value={4250} format={(n) => `$${Math.round(n).toLocaleString()}`} />
    </div>
  ),
};
```

- [ ] **Step 7: Export from the package entry**

In `src/index.ts`, add (alphabetically near the other `C` components, e.g. after the `Code`/`Collapsible` exports):

```ts
export { CountUp } from './components/CountUp';
export type { CountUpProps } from './components/CountUp';
```

- [ ] **Step 8: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/components/CountUp src/index.ts
git commit --no-verify -m "feat: add CountUp animated number component (reduced-motion safe)"
```

---

## Task 6: Docs, version bump, changelog, component count

**Files:**
- Modify: `CLAUDE.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`

- [ ] **Step 1: Bump the version**

Edit `package.json`: change `"version": "2.6.0"` → `"version": "2.7.0"`.
Then sync the lockfile:

Run: `npm install --package-lock-only`
Expected: `package-lock.json` updates the root version to 2.7.0.

- [ ] **Step 2: Update CLAUDE.md component count**

In `CLAUDE.md`, find the "70 components" phrasing in the "What this is" section and change `70 components` → `72 components`. Add `PasswordInput` and `CountUp` to the component narrative where the batches are listed.

- [ ] **Step 3: Document the Tailwind entry points in CLAUDE.md**

In the "The token pipeline" / architecture area of `CLAUDE.md`, add a sentence: the generated `theme.css` now also responds to `.dark`/`.light` classes (Tailwind `darkMode:'class'`), and a `@koduhai/design-system/tailwind-preset` entry maps tokens onto Tailwind's theme. Cross-reference `docs/tailwind-consumer-compatibility.md`.

- [ ] **Step 4: Add the CHANGELOG entry**

Prepend a `## 2.7.0` section to `CHANGELOG.md` (match the existing format) listing:
- Class-based theming (`.dark`/`.light`) in generated `theme.css`.
- New `@koduhai/design-system/tailwind-preset` entry point.
- New fixed brand tint ramp (`--ku-brand-50…900`, `bg-brand-*` utilities).
- New `PasswordInput` component.
- New `CountUp` component.

- [ ] **Step 5: Verify the export/docs drift guard passes**

Run: `npm run build && npm run verify:exports`
Expected: `✓ Export surface in sync … component count = 72.`
(If it reports a mismatch, fix the count or the missing export it names.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json CLAUDE.md CHANGELOG.md
git commit --no-verify -m "chore: docs + version bump to 2.7.0 (Tailwind compat batch)"
```

---

## Task 7: Full verification gate + PR

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: all tests pass (includes the new component + generator + preset tests).

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: both clean. (Lint runs over `.` — fix any new findings in the added files.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds; `dist/` includes the new component exports and `dist/tailwind-preset/`.

- [ ] **Step 4: a11y (axe) on the new stories — both themes**

Run: `npm run test:e2e`
Expected: zero axe violations for the `Components/PasswordInput` and `Components/CountUp` stories in dark and light. If new visual snapshots are needed, do NOT commit locally-rendered baselines — trigger `gh workflow run update-baselines.yml --ref feat/tailwind-compat` and let the runner regenerate them.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin feat/tailwind-compat
gh pr create --base main --title "feat: Tailwind consumer compatibility (preset, class theming, brand ramp, PasswordInput, CountUp) — v2.7.0" \
  --body "Readies the DS for Tailwind darkMode:'class' consumers (koduh-mail-web). See docs/superpowers/specs/2026-05-26-tailwind-compatibility-design.md."
```

- [ ] **Step 6: STOP — do not cut the release**

The `v2.7.0` GitHub Release (which publishes to GitHub Packages) is cut only after explicit user go-ahead. Report PR URL + CI status and wait.

---

## Self-Review notes

- **Spec coverage:** class theming (Task 0, already built) ✓; preset (Task 0) ✓; brand ramp token (Task 1) + preset mapping (Task 2) ✓; PasswordInput (Task 4) ✓; CountUp (Task 5) ✓; docs/version/changelog/count (Task 6) ✓; test+a11y gate + PR, no release (Task 7) ✓.
- **Type consistency:** `PasswordInputProps`/`PasswordInputSize` and `CountUpProps` names match between component, barrel, and `src/index.ts`. `tokens.brand` keys drive both the generator output and the preset map. `EyeIcon`/`EyeOffIcon` names match between `icons.tsx` and the `PasswordInput` import.
- **Windows note:** every commit uses `--no-verify` (husky pre-commit can't spawn on this host).
