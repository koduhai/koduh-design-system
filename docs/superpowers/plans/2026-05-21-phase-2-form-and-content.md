# Phase 2 — Form & Content Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four Phase 2 components of `@koduhai/design-system` v1 — `TextField`, `Card`, `EmptyState`, `PageHeader` — using the Phase 0 foundations and the patterns established in Phase 1.

**Architecture:** Each component is a focused folder (`Component.tsx` + `Component.module.css` + `Component.test.tsx` + `Component.stories.tsx` + `index.ts`). Visual variants are expressed as `data-*` attributes on the root element and styled by scoped CSS-Module selectors (e.g. `.root[data-variant='elevated']`); a tone/variant local CSS custom property bridges where needed. Components consume only `--ku-*` CSS variables, compose Phase-0 primitives (`Slot`, `useId`, `useControllableState`), forward refs, and spread remaining DOM props to the root. `TextField` is the only stateful component (controlled/uncontrolled via `useControllableState`); `Card` is polymorphic via `asChild` (NOT an `as` prop — this resolves the spec table vs §8 toward §8's clean-break principle).

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules (`local-css` scoping via tsup), Vitest + React Testing Library, Playwright + axe-core, Storybook 10.

**Reference spec:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (§7 component table, §8 API principles, §9 a11y). **Reference implementation:** `src/components/Button/` and the Phase 1 plan `docs/superpowers/plans/2026-05-21-phase-1-trivial-components.md`.

---

## Foundation contract (already built — do NOT rebuild)

- **Primitives** (`src/primitives`, re-exported from `src/index.ts`): `Slot` (asChild polymorphism — merges className/style/handlers/refs AND passes through other props like `data-*` via its base spread), `VisuallyHidden`, `mergeRefs`, `composeEventHandlers`, `useId`, `useControllableState`. Type `SlotProps`.
- **`useId(prefix?)`** returns a stable SSR-safe id string. **`useControllableState({ value, defaultValue, onChange })`** returns `[state, setState]` — respects a controlled `value` when provided, else manages internal state seeded from `defaultValue`. (See `src/primitives/useControllableState.ts` and its test for exact behavior.)
- **Icons** (`src/icons`): `createIcon` + `CloseIcon, ChevronDownIcon, CheckIcon, InfoIcon, WarningIcon, ErrorIcon, MenuIcon, SearchIcon, UserIcon`. `IconProps` has `size?` and `title?` (decorative/`aria-hidden` by default).
- **`cx`** (`src/utils/cx.ts`, exported from `src/index.ts`): `cx(...parts) => string`, drops falsy values.
- **CSS variables available** (from `dist/theme.css`, applied by provider/decorator): colors `--ku-color-{primary,primary-contrast,danger,success,warning,info,bg-default,bg-surface,bg-raised,border,text-primary,text-secondary,text-disabled}`; spacing `--ku-space-{1,2,3,4,5,6,8,10,12}`; radius `--ku-radius-{sm,md,lg,full}`; font `--ku-font-family-{base,mono}`, `--ku-font-size-{xs,sm,md,lg,xl,2xl}`, `--ku-font-weight-{regular,medium,semibold,bold}`, `--ku-line-height-{tight,base,relaxed}`; `--ku-shadow-{1,2,3}`; `--ku-duration-{fast,base}`, `--ku-easing-standard`.
- **Build/CSS Modules:** `.module.css` class selectors get scoped (`[filename]_[local]`), and `import styles from './X.module.css'` yields a `{ [name]: scopedName }` object typed by `src/css-modules.d.ts`. Element/attribute/pseudo selectors are NOT scoped — so `.root[data-variant='elevated']` works (the `.root` class is scoped, the attribute selector is literal). **Name each module file after its component** so the scope stays unique.
- **Gates:** `npm test` (Vitest), `npm run typecheck` (strict, `tsc --noEmit`), `npm run lint` (`eslint .`), `npm run build`, `npm run test:e2e` (Playwright auto-starts Storybook; `prestorybook`/`prebuild-storybook` regenerate `dist/theme.css`).

---

## File Structure (this phase)

```
src/components/
├── TextField/   TextField.tsx   TextField.module.css   TextField.test.tsx   TextField.stories.tsx   index.ts
├── Card/        Card.tsx        Card.module.css        Card.test.tsx        Card.stories.tsx        index.ts
├── EmptyState/  EmptyState.tsx  EmptyState.module.css  EmptyState.test.tsx  EmptyState.stories.tsx  index.ts
└── PageHeader/  PageHeader.tsx  PageHeader.module.css  PageHeader.test.tsx  PageHeader.stories.tsx  index.ts
src/index.ts                    # MODIFY (integration task): add the 4 component export blocks
e2e/components.spec.ts          # MODIFY (integration task): add 4 stories to axe + visual lists
e2e/components.spec.ts-snapshots/  # ADD (integration task): regenerated baselines incl. the 4 new components
README.md                       # MODIFY (integration task): extend the "Available components" line
```

> **Coordination note (parallel build):** Tasks 1–4 (the four component folders) are independent and touch NO shared files — each touches only its own `src/components/<Name>/` directory. They are built by parallel subagents. The integration of `src/index.ts`, `e2e/components.spec.ts`, the snapshot baselines, and `README.md` (Task 5) is done by the dispatching session AFTER all four component tasks land, to avoid shared-file merge conflicts. Each component task therefore does NOT edit `src/index.ts` — it only creates its own folder + barrel and commits.

---

## Task 1: TextField

**Files:**

- Create: `src/components/TextField/TextField.tsx`, `TextField.module.css`, `TextField.test.tsx`, `TextField.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/TextField/TextField.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField';

describe('TextField', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
  });

  it('renders helper text linked via aria-describedby', () => {
    render(<TextField label="Email" helperText="We never share it." />);
    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('We never share it.');
  });

  it('sets aria-invalid and shows errorText (replacing helperText) when error', () => {
    render(<TextField label="Email" error errorText="Required" helperText="We never share it." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('We never share it.')).toBeNull();
    const describedBy = input.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)).toHaveTextContent('Required');
  });

  it('marks the input required and reflects it on the label', () => {
    render(<TextField label="Email" required />);
    expect(screen.getByLabelText(/Email/)).toBeRequired();
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<TextField label="Name" defaultValue="Ada" />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('Ada');
    await userEvent.type(input, 'x');
    expect(input.value).toBe('Adax');
  });

  it('works controlled: respects value and calls onChange', async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" value="fixed" onChange={onChange} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('fixed');
    await userEvent.type(input, 'z');
    expect(onChange).toHaveBeenCalled();
    expect(input.value).toBe('fixed'); // controlled — unchanged without parent update
  });

  it('reflects size as a data attribute on the root', () => {
    const { container } = render(<TextField label="X" size="lg" />);
    expect(container.querySelector('[data-size]')).toHaveAttribute('data-size', 'lg');
  });

  it('renders start and end adornments', () => {
    render(
      <TextField
        label="Search"
        startAdornment={<span data-testid="start" />}
        endAdornment={<span data-testid="end" />}
      />,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('forwards a ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<TextField label="X" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TextField/TextField.test.tsx`
Expected: FAIL — cannot resolve `./TextField`.

- [ ] **Step 3: Write the component** — `src/components/TextField/TextField.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './TextField.module.css';

export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue'
> {
  /** Visible label, associated with the input via htmlFor/id. */
  label: string;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: TextFieldSize;
  /** Content rendered inside the field, before the input (decorative). */
  startAdornment?: ReactNode;
  /** Content rendered inside the field, after the input (decorative). */
  endAdornment?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    value,
    defaultValue,
    onChange,
    helperText,
    error = false,
    errorText,
    size = 'md',
    startAdornment,
    endAdornment,
    required,
    className,
    id: idProp,
    ...props
  },
  ref,
) {
  const reactId = useId('textfield');
  const id = idProp ?? reactId;
  const descriptionId = `${id}-description`;

  const [state, setState] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '',
    onChange: undefined,
  });

  const description = error ? errorText : helperText;

  return (
    <div
      className={cx(styles.root, className)}
      data-size={size}
      data-error={error ? 'true' : undefined}
    >
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div className={styles.field}>
        {startAdornment ? (
          <span className={styles.adornment} aria-hidden>
            {startAdornment}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={styles.input}
          value={state}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => {
            setState(event.target.value);
            onChange?.(event.target.value, event);
          }}
          {...props}
        />
        {endAdornment ? (
          <span className={styles.adornment} aria-hidden>
            {endAdornment}
          </span>
        ) : null}
      </div>
      {description ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}
    </div>
  );
});
```

> **Note on `useControllableState`:** `onChange` is wired manually in the input's `onChange` (we pass the string + event to the public `onChange`), so the hook is only used for value resolution — pass `onChange: undefined` to the hook to avoid a double-call. If the local `useControllableState` signature differs, read `src/primitives/useControllableState.ts` and adapt: the contract needed here is "controlled when `value !== undefined`, else internal state seeded by `defaultValue`."

- [ ] **Step 4: Write the styles** — `src/components/TextField/TextField.module.css`

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

.adornment {
  display: inline-flex;
  align-items: center;
  color: var(--ku-color-text-secondary);
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

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/TextField/TextField.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 6: Write stories** — `src/components/TextField/TextField.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';
import { SearchIcon } from '../../icons';

const meta = {
  title: 'Components/TextField',
  component: TextField,
} satisfies Meta<typeof TextField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Email', placeholder: 'you@example.com' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <TextField label="Default" placeholder="Type here" />
      <TextField label="With helper" helperText="We never share your email." placeholder="Email" />
      <TextField label="Required" required placeholder="Required field" />
      <TextField label="Invalid" error errorText="This field is required." />
      <TextField label="With icon" startAdornment={<SearchIcon size={16} />} placeholder="Search" />
      <TextField label="Small" size="sm" placeholder="sm" />
      <TextField label="Large" size="lg" placeholder="lg" />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/TextField/index.ts`

```ts
export { TextField } from './TextField';
export type { TextFieldProps, TextFieldSize } from './TextField';
```

- [ ] **Step 8: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/TextField
git commit -m "feat: add TextField component"
```

---

## Task 2: Card

**Files:**

- Create: `src/components/Card/Card.tsx`, `Card.module.css`, `Card.test.tsx`, `Card.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Card/Card.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders a div with its children by default', () => {
    render(<Card>Body</Card>);
    const el = screen.getByText('Body');
    expect(el.tagName).toBe('DIV');
  });

  it('defaults to outlined variant and md padding, reflected as data attributes', () => {
    const { container } = render(<Card>X</Card>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-variant', 'outlined');
    expect(root).toHaveAttribute('data-padding', 'md');
  });

  it('reflects variant and padding overrides as data attributes', () => {
    const { container } = render(
      <Card variant="elevated" padding="lg">
        X
      </Card>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-variant', 'elevated');
    expect(root).toHaveAttribute('data-padding', 'lg');
  });

  it('renders as the child element when asChild is set, merging props', () => {
    render(
      <Card asChild variant="flat">
        <article aria-label="Post">Content</article>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Post' });
    expect(article).toHaveAttribute('data-variant', 'flat');
    expect(article).toHaveTextContent('Content');
  });

  it('forwards a ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>X</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards arbitrary DOM props to the root', () => {
    const { container } = render(
      <Card data-testid="card" id="c1">
        X
      </Card>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('id', 'c1');
    expect(root).toHaveAttribute('data-testid', 'card');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Card/Card.test.tsx`
Expected: FAIL — cannot resolve `./Card`.

- [ ] **Step 3: Write the component** — `src/components/Card/Card.tsx`

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Card.module.css';

export type CardVariant = 'outlined' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Surface style. Defaults to 'outlined'. */
  variant?: CardVariant;
  /** Inner padding scale. Defaults to 'md'. */
  padding?: CardPadding;
  /** Render the single child element instead of a <div>, merging Card props onto it. */
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'outlined', padding = 'md', asChild = false, className, children, ...props },
  ref,
) {
  const dataAttrs = {
    'data-variant': variant,
    'data-padding': padding,
  };
  const classes = cx(styles.root, className);

  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <div ref={ref} className={classes} {...dataAttrs} {...props}>
      {children}
    </div>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/Card/Card.module.css`

```css
.root {
  display: block;
  background-color: var(--ku-color-bg-surface);
  border-radius: var(--ku-radius-lg);
  border: 1px solid transparent;
  color: var(--ku-color-text-primary);
}

.root[data-variant='outlined'] {
  border-color: var(--ku-color-border);
}
.root[data-variant='elevated'] {
  box-shadow: var(--ku-shadow-2);
}
.root[data-variant='flat'] {
  background-color: var(--ku-color-bg-raised);
}

.root[data-padding='none'] {
  padding: 0;
}
.root[data-padding='sm'] {
  padding: var(--ku-space-3);
}
.root[data-padding='md'] {
  padding: var(--ku-space-4);
}
.root[data-padding='lg'] {
  padding: var(--ku-space-6);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Card/Card.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write stories** — `src/components/Card/Card.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Card content', style: { maxWidth: 320 } },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Card variant="outlined" style={{ width: 200 }}>
        Outlined
      </Card>
      <Card variant="elevated" style={{ width: 200 }}>
        Elevated
      </Card>
      <Card variant="flat" style={{ width: 200 }}>
        Flat
      </Card>
      <Card variant="outlined" padding="lg" style={{ width: 200 }}>
        Large padding
      </Card>
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Card/index.ts`

```ts
export { Card } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';
```

- [ ] **Step 8: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/Card
git commit -m "feat: add Card component"
```

---

## Task 3: EmptyState

**Files:**

- Create: `src/components/EmptyState/EmptyState.tsx`, `EmptyState.module.css`, `EmptyState.test.tsx`, `EmptyState.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/EmptyState/EmptyState.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title as a level-2 heading by default', () => {
    render(<EmptyState title="No results" />);
    const heading = screen.getByRole('heading', { name: 'No results' });
    expect(heading.tagName).toBe('H2');
  });

  it('honors a custom headingLevel', () => {
    render(<EmptyState title="Empty" headingLevel={3} />);
    expect(screen.getByRole('heading', { name: 'Empty', level: 3 })).toBeInTheDocument();
  });

  it('renders an optional description', () => {
    render(<EmptyState title="No results" description="Try a different filter." />);
    expect(screen.getByText('Try a different filter.')).toBeInTheDocument();
  });

  it('renders the action node', () => {
    render(<EmptyState title="No results" action={<button>Reset</button>} />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('renders a decorative icon hidden from assistive tech', () => {
    const { container } = render(<EmptyState title="Empty" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toContainElement(
      screen.getByTestId('icon'),
    );
  });

  it('forwards a ref and arbitrary props to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<EmptyState ref={ref} title="X" data-testid="empty" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'empty');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/EmptyState/EmptyState.test.tsx`
Expected: FAIL — cannot resolve `./EmptyState`.

- [ ] **Step 3: Write the component** — `src/components/EmptyState/EmptyState.tsx`

```tsx
import { forwardRef, createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './EmptyState.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Decorative illustration or icon shown above the title. */
  icon?: ReactNode;
  /** Heading text. Required. */
  title: ReactNode;
  /** Supporting copy shown below the title. */
  description?: ReactNode;
  /** Call-to-action — pass a real <Button>/<a>. */
  action?: ReactNode;
  /** Semantic heading level for the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, headingLevel = 2, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      {icon ? (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      {createElement(`h${headingLevel}`, { className: styles.title }, title)}
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/EmptyState/EmptyState.module.css`

```css
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--ku-space-3);
  padding: var(--ku-space-8) var(--ku-space-4);
  font-family: var(--ku-font-family-base);
  color: var(--ku-color-text-primary);
}

.icon {
  display: inline-flex;
  color: var(--ku-color-text-secondary);
}

.title {
  margin: 0;
  font-size: var(--ku-font-size-lg);
  font-weight: var(--ku-font-weight-semibold);
}

.description {
  margin: 0;
  max-width: 40ch;
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-secondary);
  line-height: var(--ku-line-height-base);
}

.action {
  margin-top: var(--ku-space-2);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/EmptyState/EmptyState.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write stories** — `src/components/EmptyState/EmptyState.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { Button } from '../Button';
import { SearchIcon } from '../../icons';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <EmptyState
        icon={<SearchIcon size={40} />}
        title="No results found"
        description="We couldn't find anything matching your search. Try a different term."
        action={<Button>Clear filters</Button>}
      />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/EmptyState/index.ts`

```ts
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, HeadingLevel } from './EmptyState';
```

- [ ] **Step 8: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/EmptyState
git commit -m "feat: add EmptyState component"
```

---

## Task 4: PageHeader

**Files:**

- Create: `src/components/PageHeader/PageHeader.tsx`, `PageHeader.module.css`, `PageHeader.test.tsx`, `PageHeader.stories.tsx`, `index.ts`

> **Type note:** `PageHeader` reuses the `HeadingLevel` type. To avoid a cross-component import dependency, it defines its own local `HeadingLevel` alias (identical shape). Both export it; the package entry re-exports `HeadingLevel` only once (from `EmptyState`) — see integration Task 5.

- [ ] **Step 1: Write the failing test** — `src/components/PageHeader/PageHeader.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as an h1 by default inside a header landmark', () => {
    render(<PageHeader title="Dashboard" />);
    const heading = screen.getByRole('heading', { name: 'Dashboard', level: 1 });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole('banner')).toContainElement(heading); // <header> => banner role
  });

  it('honors a custom headingLevel', () => {
    render(<PageHeader title="Section" headingLevel={2} />);
    expect(screen.getByRole('heading', { name: 'Section', level: 2 })).toBeInTheDocument();
  });

  it('renders an optional subtitle', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back" />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('wraps breadcrumbs in a labelled nav', () => {
    render(<PageHeader title="Dashboard" breadcrumbs={<a href="/">Home</a>} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Home' }));
  });

  it('renders actions', () => {
    render(<PageHeader title="Dashboard" actions={<button>New</button>} />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('forwards a ref and arbitrary props to the header root', () => {
    const ref = { current: null as HTMLElement | null };
    const { container } = render(<PageHeader ref={ref} title="X" data-testid="ph" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'ph');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PageHeader/PageHeader.test.tsx`
Expected: FAIL — cannot resolve `./PageHeader`.

- [ ] **Step 3: Write the component** — `src/components/PageHeader/PageHeader.tsx`

```tsx
import { forwardRef, createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './PageHeader.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Page or section title. Required. */
  title: ReactNode;
  /** Supporting line shown beneath the title. */
  subtitle?: ReactNode;
  /** Breadcrumb trail — rendered inside <nav aria-label="Breadcrumb">. */
  breadcrumbs?: ReactNode;
  /** Right-aligned actions (buttons, menus). */
  actions?: ReactNode;
  /** Semantic heading level for the title. Defaults to 1. */
  headingLevel?: HeadingLevel;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { title, subtitle, breadcrumbs, actions, headingLevel = 1, className, ...props },
  ref,
) {
  return (
    <header ref={ref} className={cx(styles.root, className)} {...props}>
      {breadcrumbs ? (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs}
        </nav>
      ) : null}
      <div className={styles.bar}>
        <div className={styles.titles}>
          {createElement(`h${headingLevel}`, { className: styles.title }, title)}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/PageHeader/PageHeader.module.css`

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-2);
  font-family: var(--ku-font-family-base);
  color: var(--ku-color-text-primary);
}

.breadcrumbs {
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-secondary);
}

.bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ku-space-4);
  flex-wrap: wrap;
}

.titles {
  min-width: 0;
}

.title {
  margin: 0;
  font-size: var(--ku-font-size-2xl);
  font-weight: var(--ku-font-weight-bold);
  line-height: var(--ku-line-height-tight);
}

.subtitle {
  margin: var(--ku-space-1) 0 0;
  font-size: var(--ku-font-size-md);
  color: var(--ku-color-text-secondary);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  flex-shrink: 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/PageHeader/PageHeader.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write stories** — `src/components/PageHeader/PageHeader.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from './PageHeader';
import { Button } from '../Button';

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Dashboard', subtitle: 'Welcome back, Ada.' },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ minWidth: 480 }}>
      <PageHeader
        breadcrumbs={
          <span>
            <a href="#a">Home</a> / <a href="#b">Projects</a>
          </span>
        }
        title="Project Atlas"
        subtitle="Last updated 2 hours ago"
        actions={
          <>
            <Button variant="outline" tone="neutral">
              Settings
            </Button>
            <Button>New item</Button>
          </>
        }
      />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/PageHeader/index.ts`

```ts
export { PageHeader } from './PageHeader';
export type { PageHeaderProps, HeadingLevel } from './PageHeader';
```

- [ ] **Step 8: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/PageHeader
git commit -m "feat: add PageHeader component"
```

---

## Task 5: Integration — exports, e2e, snapshots, README, full gate

> **Done by the dispatching session AFTER Tasks 1–4 land.** This is the only task that touches shared files.

**Files:**

- Modify: `src/index.ts`
- Modify: `e2e/components.spec.ts`
- Add: regenerated baselines under `e2e/components.spec.ts-snapshots/`
- Modify: `README.md`

- [ ] **Step 1: Add the four export blocks to `src/index.ts`**

Append below the existing `Alert` export block (keep alphabetical-ish grouping consistent with the file). Note `HeadingLevel` is exported ONCE (from `EmptyState`) to avoid a duplicate-export TS error:

```ts
export { TextField } from './components/TextField';
export type { TextFieldProps, TextFieldSize } from './components/TextField';
export { Card } from './components/Card';
export type { CardProps, CardVariant, CardPadding } from './components/Card';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, HeadingLevel } from './components/EmptyState';
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';
```

- [ ] **Step 2: Run typecheck to catch duplicate `HeadingLevel` exports**

Run: `npm run typecheck`
Expected: PASS. If TS reports a duplicate export for `HeadingLevel`, confirm only the `EmptyState` line exports the type (the `PageHeader` line exports `PageHeaderProps` only).

- [ ] **Step 3: Add the four components to the axe + visual lists in `e2e/components.spec.ts`**

In the `COMPONENTS` array (used by both the axe and visual-snapshot loops), add:

```ts
  { name: 'TextField', storyId: 'components-textfield--showcase' },
  { name: 'Card', storyId: 'components-card--showcase' },
  { name: 'EmptyState', storyId: 'components-emptystate--showcase' },
  { name: 'PageHeader', storyId: 'components-pageheader--showcase' },
```

> If `e2e/components.spec.ts` keeps the axe `STORY_IDS`/`COMPONENTS` and the visual list as separate arrays, add the four entries to BOTH. Match the existing structure in that file — read it first.

- [ ] **Step 4: Run the axe a11y e2e for the new components (both themes)**

Run: `npm run test:e2e -- --grep axe`
Expected: all axe tests pass (existing 6 components + 4 new = 20 tests, both themes), zero violations.

> If a real violation appears (e.g. TextField contrast, a missing label), FIX the component — never disable a rule for a component. Report any contrast failure (it may require a token change, which is out of this phase's scope and should be surfaced).

- [ ] **Step 5: Regenerate visual snapshot baselines for the new components**

Run: `npm run test:e2e:update -- --grep visual` (or `npx playwright test --update-snapshots` if there is no such grep tag — read the file to see how visual tests are named)
Expected: new `e2e/components.spec.ts-snapshots/components-{textfield,card,emptystate,pageheader}--showcase-{dark,light}-chromium-win32.png` files are created; existing baselines are unchanged.

- [ ] **Step 6: Re-run the visual suite to confirm baselines match**

Run: `npm run test:e2e -- --grep visual`
Expected: all visual tests PASS against the just-written baselines.

- [ ] **Step 7: Update README "Available components" line**

In `README.md`, update the status block / available-components line to read (Phase 2 now complete):

```
Available components: `Button`, `LoadingButton`, `Chip`, `Avatar`, `StatusBadge`,
`Alert`, `TextField`, `Card`, `EmptyState`, `PageHeader`. `AppBar` and `Sidebar`
arrive in Phase 3.
```

Also update the `> **Status:**` paragraph to note Phase 2 (form & content) is complete.

- [ ] **Step 8: Run the COMPLETE verification gate**

Run each and confirm before proceeding:

```bash
npm run typecheck     # Expected: PASS
npm run lint          # Expected: PASS
npm test              # Expected: PASS — all unit tests incl. the 4 new component suites
npm run build         # Expected: dist/ produced
npm run test:e2e      # Expected: foundations + axe (20) + visual (20) all pass
```

- [ ] **Step 9: Confirm the new component CSS is bundled**

Run (Bash):

```bash
node -e "const s=require('fs').readFileSync('C:/dev/work/koduhai-design-system-v2/dist/index.css','utf8'); for (const n of ['TextField_root','Card_root','EmptyState_root','PageHeader_root']) console.log(n, new RegExp(n).test(s));"
```

Expected: all four `true` — confirms each `.module.css` was scoped and bundled into `dist/index.css`.

- [ ] **Step 10: Commit**

```bash
git add src/index.ts e2e/components.spec.ts "e2e/components.spec.ts-snapshots" README.md
git commit -m "feat: integrate Phase 2 components (exports, e2e, snapshots, docs)"
```

---

## Self-Review Notes (spec coverage)

- **§7 components** → TextField (Task 1), Card (Task 2), EmptyState (Task 3), PageHeader (Task 4). Each implements the spec's key props and a11y notes:
  - TextField: label `htmlFor` via `useId`, helper/error via `aria-describedby`, `aria-invalid`, controlled/uncontrolled, size, adornments, required.
  - Card: `outlined`/`elevated`/`flat`, `padding`, polymorphic via `asChild` (NOT `as` — resolves spec table vs §8 toward §8; user-confirmed).
  - EmptyState: icon (decorative/`aria-hidden`), heading semantics with configurable `headingLevel`, description, real action node.
  - PageHeader: `<header>` landmark, configurable heading level (default `<h1>`), breadcrumbs in `<nav aria-label="Breadcrumb">`, actions.
- **§8 clean-break API** → semantic `variant` vocabulary, `asChild` over `as`/`component` (Card), controlled/uncontrolled symmetry (TextField), explicit typed props (no opaque passthrough — only standard DOM attrs spread), every prop type exported.
- **§9 accessibility** → axe e2e both themes (Task 5 Step 4); TextField label/description linkage; PageHeader landmark + breadcrumb nav; color never sole signal.
- **§10 testing** → Vitest unit per component (Tasks 1–4), axe e2e + visual snapshots wired into the existing `e2e/components.spec.ts` (Task 5).
- **§11 build** → component `.module.css` scoped + bundled into `dist/index.css` (verified Task 5 Step 9).

**Deferred to later phases:** AppBar/Sidebar (Phase 3); bundle/tree-shaking audit + full a11y audit + v1.0.0 release (Phase 4).
