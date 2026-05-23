# Phase 1 — Trivial Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first six components of `@koduhai/design-system` v1 — Button, LoadingButton, Chip, Avatar, StatusBadge, Alert — using the foundations from Phase 0 (tokens, primitives, icons, theme provider, CSS-Modules build).

**Architecture:** Each component is a focused folder (`Component.tsx` + `Component.module.css` + `Component.test.tsx` + `Component.stories.tsx` + `index.ts`). Visual variants are expressed as `data-*` attributes on the root element and styled by scoped CSS-Module selectors (e.g. `.root[data-variant='outline']`); tone sets a local CSS custom property that the variant rules consume, avoiding a variant×tone class explosion. Components consume only `--ku-*` CSS variables, compose Phase-0 primitives, and forward refs.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules (`local-css` scoping via tsup), Vitest + React Testing Library, Playwright + axe-core, Storybook 10.

**Reference spec:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (§7 component table, §8 API principles, §9 a11y).

---

## Foundation contract (already built in Phase 0 — do NOT rebuild)

- **Primitives** (`src/primitives`, re-exported from `src/index.ts`): `Slot` (asChild polymorphism — merges className/style/handlers/refs AND passes through other props like `data-*` via its base spread), `VisuallyHidden`, `mergeRefs`, `composeEventHandlers`, `useId`, `useControllableState`. Type `SlotProps`.
- **Icons** (`src/icons`): `createIcon` + `CloseIcon, ChevronDownIcon, CheckIcon, InfoIcon, WarningIcon, ErrorIcon, MenuIcon, SearchIcon, UserIcon`. `IconProps` has `size?` and `title?` (decorative/`aria-hidden` by default).
- **Theme** (`src/theme`): `tokens`, `themes`, types `ColorMode`, `ColorTokenName`, `Tokens`.
- **Provider** (`src/provider`): `KoduhThemeProvider`, `useColorMode`.
- **CSS variables available** (from `dist/theme.css`, applied by provider/decorator): colors `--ku-color-{primary,primary-contrast,danger,success,warning,info,bg-default,bg-surface,bg-raised,border,text-primary,text-secondary,text-disabled}`; spacing `--ku-space-{1,2,3,4,5,6,8,10,12}`; radius `--ku-radius-{sm,md,lg,full}`; font `--ku-font-family-{base,mono}`, `--ku-font-size-{xs,sm,md,lg,xl,2xl}`, `--ku-font-weight-{regular,medium,semibold,bold}`, `--ku-line-height-{tight,base,relaxed}`; `--ku-shadow-{1,2,3}`; `--ku-duration-{fast,base}`, `--ku-easing-standard`.
- **Build/CSS Modules:** `.module.css` class selectors get scoped (`[filename]_[local]`), and `import styles from './X.module.css'` yields a `{ [name]: scopedName }` object. `src/css-modules.d.ts` types this. Element/attribute/pseudo selectors are NOT scoped — so `.root[data-variant='solid']` works (the `.root` class is scoped, the attribute selector is literal).
- **Convention (from Phase 0 final review):** name each module file after its component so the `[filename]_[local]` scope stays unique.
- **Gates:** `npm test` (Vitest), `npm run typecheck` (strict), `npm run lint` (`eslint src`), `npm run build`, `npm run test:e2e` (Playwright auto-starts Storybook; `prestorybook`/`prebuild-storybook` regenerate `dist/theme.css`).

---

## File Structure (created in this phase)

```
src/
├── utils/
│   ├── cx.ts                     # className join helper
│   └── cx.test.ts
├── components/
│   ├── Button/        Button.tsx        Button.module.css        Button.test.tsx        Button.stories.tsx        index.ts
│   ├── LoadingButton/ LoadingButton.tsx LoadingButton.module.css LoadingButton.test.tsx LoadingButton.stories.tsx index.ts
│   ├── Chip/          Chip.tsx          Chip.module.css          Chip.test.tsx          Chip.stories.tsx          index.ts
│   ├── Avatar/        Avatar.tsx        Avatar.module.css        Avatar.test.tsx        Avatar.stories.tsx        index.ts
│   ├── StatusBadge/   StatusBadge.tsx   StatusBadge.module.css   StatusBadge.test.tsx   StatusBadge.stories.tsx   index.ts
│   └── Alert/         Alert.tsx         Alert.module.css         Alert.test.tsx         Alert.stories.tsx         index.ts
└── index.ts                      # MODIFY: add component exports as built
e2e/
├── components.spec.ts            # axe a11y for all 6 components, both themes
└── snapshots.spec.ts             # visual regression baselines per component/theme
README.md                        # MODIFY: add consumer Usage section
package.json                     # MODIFY: add test:e2e:update script
```

Each component task adds one export block to `src/index.ts` (replacing the `// NOTE:` placeholder over the course of the phase).

---

## Task 1: `cx` className helper

**Files:**

- Create: `src/utils/cx.ts`
- Test: `src/utils/cx.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/utils/cx.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins truthy string parts with spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops false, null, undefined, and empty strings', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cx(false, undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/cx.test.ts`
Expected: FAIL — cannot resolve `./cx`.

- [ ] **Step 3: Write the implementation** — `src/utils/cx.ts`

```ts
/** Join class name parts, dropping falsy values. Zero-dependency clsx-lite. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/cx.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Export `cx` from the package entry**

In `src/index.ts`, replace the line:

```ts
// NOTE: the 12 components are exported here as they are built in Phases 1–4.
```

with:

```ts
// Utilities
export { cx } from './utils/cx';

// Components
// NOTE: the 12 components are exported here as they are built in Phases 1–4.
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/cx.ts src/utils/cx.test.ts src/index.ts
git commit -m "feat: add cx className helper"
```

---

## Task 2: Button

**Files:**

- Create: `src/components/Button/Button.tsx`, `Button.module.css`, `Button.test.tsx`, `Button.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Button/Button.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders a native button with type="button" by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('defaults to solid/primary/md and reflects overrides as data attributes', () => {
    const { rerender } = render(<Button>X</Button>);
    let btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-tone', 'primary');
    expect(btn).toHaveAttribute('data-size', 'md');

    rerender(
      <Button variant="outline" tone="danger" size="lg">
        X
      </Button>,
    );
    btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'outline');
    expect(btn).toHaveAttribute('data-tone', 'danger');
    expect(btn).toHaveAttribute('data-size', 'lg');
  });

  it('fires onClick, but not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1); // unchanged
  });

  it('renders start and end icons', () => {
    render(
      <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Go
      </Button>,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('renders as the child element when asChild is set, merging props', () => {
    render(
      <Button asChild tone="danger">
        <a href="/contact">Contact</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', '/contact');
    expect(link).toHaveAttribute('data-tone', 'danger');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('forwards a ref to the button element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Button/Button.test.tsx`
Expected: FAIL — cannot resolve `./Button`.

- [ ] **Step 3: Write the component** — `src/components/Button/Button.tsx`

```tsx
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonTone = 'primary' | 'neutral' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to 'solid'. */
  variant?: ButtonVariant;
  /** Semantic color. Defaults to 'primary'. */
  tone?: ButtonTone;
  /** Defaults to 'md'. */
  size?: ButtonSize;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Icon before the label (ignored when asChild). */
  startIcon?: ReactNode;
  /** Icon after the label (ignored when asChild). */
  endIcon?: ReactNode;
  /** Render the single child element instead of a <button>, merging button props onto it. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    tone = 'primary',
    size = 'md',
    fullWidth = false,
    startIcon,
    endIcon,
    asChild = false,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const dataAttrs = {
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
    'data-full-width': fullWidth ? 'true' : undefined,
  };
  const classes = cx(styles.root, className);

  if (asChild) {
    // Button's ref is typed for HTMLButtonElement; Slot accepts Ref<HTMLElement>.
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...dataAttrs} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} className={classes} type={type ?? 'button'} {...dataAttrs} {...props}>
      {startIcon ? (
        <span className={styles.icon} aria-hidden>
          {startIcon}
        </span>
      ) : null}
      {children}
      {endIcon ? (
        <span className={styles.icon} aria-hidden>
          {endIcon}
        </span>
      ) : null}
    </button>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/Button/Button.module.css`

```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ku-space-2);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-semibold);
  line-height: 1;
  border-radius: var(--ku-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color var(--ku-duration-fast) var(--ku-easing-standard),
    border-color var(--ku-duration-fast) var(--ku-easing-standard),
    color var(--ku-duration-fast) var(--ku-easing-standard);
}

.root:disabled,
.root[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* tone → local color vars */
.root[data-tone='primary'] {
  --btn-main: var(--ku-color-primary);
  --btn-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='neutral'] {
  --btn-main: var(--ku-color-text-primary);
  --btn-contrast: var(--ku-color-bg-default);
}
.root[data-tone='danger'] {
  --btn-main: var(--ku-color-danger);
  --btn-contrast: var(--ku-color-bg-default);
}

/* variant consumes the tone vars */
.root[data-variant='solid'] {
  background-color: var(--btn-main);
  color: var(--btn-contrast);
}
.root[data-variant='outline'] {
  background-color: transparent;
  color: var(--btn-main);
  border-color: var(--btn-main);
}
.root[data-variant='ghost'] {
  background-color: transparent;
  color: var(--btn-main);
}
.root[data-variant='outline']:hover:not(:disabled),
.root[data-variant='ghost']:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--btn-main) 14%, transparent);
}

/* size */
.root[data-size='sm'] {
  min-height: 32px;
  padding: var(--ku-space-1) var(--ku-space-3);
  font-size: var(--ku-font-size-sm);
}
.root[data-size='md'] {
  min-height: 40px;
  padding: var(--ku-space-2) var(--ku-space-4);
  font-size: var(--ku-font-size-md);
}
.root[data-size='lg'] {
  min-height: 48px;
  padding: var(--ku-space-3) var(--ku-space-5);
  font-size: var(--ku-font-size-lg);
}

.root[data-full-width='true'] {
  width: 100%;
}

.icon {
  display: inline-flex;
  align-items: center;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Button/Button.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write stories** — `src/components/Button/Button.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Button' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="solid" tone="primary">
        Solid
      </Button>
      <Button variant="outline" tone="primary">
        Outline
      </Button>
      <Button variant="ghost" tone="primary">
        Ghost
      </Button>
      <Button tone="neutral">Neutral</Button>
      <Button tone="danger">Danger</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Button/index.ts`

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize } from './Button';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, immediately below the `// Components` comment, add:

```ts
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize } from './components/Button';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/Button src/index.ts
git commit -m "feat: add Button component"
```

---

## Task 3: LoadingButton

**Files:**

- Create: `src/components/LoadingButton/LoadingButton.tsx`, `LoadingButton.module.css`, `LoadingButton.test.tsx`, `LoadingButton.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/LoadingButton/LoadingButton.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingButton } from './LoadingButton';

describe('LoadingButton', () => {
  it('renders a normal button when not loading', () => {
    render(<LoadingButton>Save</LoadingButton>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).not.toHaveAttribute('aria-busy');
    expect(btn).not.toBeDisabled();
  });

  it('sets aria-busy and disables interaction while loading', async () => {
    const onClick = vi.fn();
    render(
      <LoadingButton loading onClick={onClick}>
        Save
      </LoadingButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes loadingText to assistive tech while loading', () => {
    render(
      <LoadingButton loading loadingText="Saving…">
        Save
      </LoadingButton>,
    );
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('forwards Button props like tone', () => {
    render(<LoadingButton tone="danger">Delete</LoadingButton>);
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'danger');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/LoadingButton/LoadingButton.test.tsx`
Expected: FAIL — cannot resolve `./LoadingButton`.

- [ ] **Step 3: Write the component** — `src/components/LoadingButton/LoadingButton.tsx`

```tsx
import { forwardRef } from 'react';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';
import { VisuallyHidden } from '../../primitives';
import styles from './LoadingButton.module.css';

export interface LoadingButtonProps extends ButtonProps {
  /** Show a spinner, set aria-busy, and disable interaction. */
  loading?: boolean;
  /** Screen-reader-only text announced while loading (e.g. "Saving…"). */
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading = false, loadingText, disabled, startIcon, children, ...props },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        startIcon={loading ? <span className={styles.spinner} aria-hidden /> : startIcon}
        {...props}
      >
        {children}
        {loading && loadingText ? <VisuallyHidden>{loadingText}</VisuallyHidden> : null}
      </Button>
    );
  },
);
```

- [ ] **Step 4: Write the styles** — `src/components/LoadingButton/LoadingButton.module.css`

```css
.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--ku-radius-full);
  animation: ku-loadingbutton-spin var(--ku-duration-base) linear infinite;
}

@keyframes ku-loadingbutton-spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/LoadingButton/LoadingButton.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Write stories** — `src/components/LoadingButton/LoadingButton.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingButton } from './LoadingButton';

const meta = {
  title: 'Components/LoadingButton',
  component: LoadingButton,
} satisfies Meta<typeof LoadingButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Save' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <LoadingButton>Idle</LoadingButton>
      <LoadingButton loading loadingText="Saving…">
        Saving
      </LoadingButton>
      <LoadingButton loading tone="danger" loadingText="Deleting…">
        Deleting
      </LoadingButton>
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/LoadingButton/index.ts`

```ts
export { LoadingButton } from './LoadingButton';
export type { LoadingButtonProps } from './LoadingButton';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, below the Button exports, add:

```ts
export { LoadingButton } from './components/LoadingButton';
export type { LoadingButtonProps } from './components/LoadingButton';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/LoadingButton src/index.ts
git commit -m "feat: add LoadingButton component"
```

---

## Task 4: Chip

**Files:**

- Create: `src/components/Chip/Chip.tsx`, `Chip.module.css`, `Chip.test.tsx`, `Chip.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Chip/Chip.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders a non-interactive chip as a span with the label', () => {
    render(<Chip label="Tag" />);
    const el = screen.getByText('Tag');
    expect(el.closest('span')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a button and fires onClick when clickable', async () => {
    const onClick = vi.fn();
    render(<Chip label="Filter" onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Filter' });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a labelled delete button that fires onDelete (and not onClick)', async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<Chip label="Apple" onClick={onClick} onDelete={onDelete} />);
    const del = screen.getByRole('button', { name: 'Remove Apple' });
    await userEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('reflects variant/tone/size as data attributes', () => {
    render(<Chip label="X" variant="outline" tone="danger" size="sm" />);
    const el = screen.getByText('X').closest('[data-variant]')!;
    expect(el).toHaveAttribute('data-variant', 'outline');
    expect(el).toHaveAttribute('data-tone', 'danger');
    expect(el).toHaveAttribute('data-size', 'sm');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Chip/Chip.test.tsx`
Expected: FAIL — cannot resolve `./Chip`.

- [ ] **Step 3: Write the component** — `src/components/Chip/Chip.tsx`

```tsx
import { forwardRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Chip.module.css';

export type ChipVariant = 'solid' | 'outline';
export type ChipTone = 'primary' | 'neutral' | 'danger';
export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  /** Text shown in the chip. */
  label: string;
  variant?: ChipVariant;
  tone?: ChipTone;
  size?: ChipSize;
  /** Leading icon (decorative). */
  icon?: ReactNode;
  /** Makes the chip a clickable button. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Adds a labelled delete affordance. */
  onDelete?: () => void;
  /** Accessible label for the delete button. Defaults to "Remove <label>". */
  deleteLabel?: string;
  className?: string;
}

export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    label,
    variant = 'solid',
    tone = 'neutral',
    size = 'md',
    icon,
    onClick,
    onDelete,
    deleteLabel,
    className,
  },
  ref,
) {
  const interactive = Boolean(onClick) && !onDelete;
  const dataAttrs = {
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
  };
  const classes = cx(styles.root, className);
  const content = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{label}</span>
      {onDelete ? (
        <button
          type="button"
          className={styles.delete}
          aria-label={deleteLabel ?? `Remove ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button ref={ref} type="button" className={classes} onClick={onClick} {...dataAttrs}>
        {content}
      </button>
    );
  }

  return (
    <span ref={ref} className={classes} onClick={onClick} {...dataAttrs}>
      {content}
    </span>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/Chip/Chip.module.css`

```css
.root {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-2);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-medium);
  border-radius: var(--ku-radius-full);
  border: 1px solid transparent;
  white-space: nowrap;
}

.root[data-tone='primary'] {
  --chip-main: var(--ku-color-primary);
  --chip-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='neutral'] {
  --chip-main: var(--ku-color-bg-raised);
  --chip-contrast: var(--ku-color-text-primary);
}
.root[data-tone='danger'] {
  --chip-main: var(--ku-color-danger);
  --chip-contrast: var(--ku-color-bg-default);
}

.root[data-variant='solid'] {
  background-color: var(--chip-main);
  color: var(--chip-contrast);
}
.root[data-variant='outline'] {
  background-color: transparent;
  color: var(--ku-color-text-primary);
  border-color: var(--ku-color-border);
}

.root[data-size='sm'] {
  padding: 2px var(--ku-space-2);
  font-size: var(--ku-font-size-xs);
}
.root[data-size='md'] {
  padding: var(--ku-space-1) var(--ku-space-3);
  font-size: var(--ku-font-size-sm);
}

button.root {
  cursor: pointer;
}

.label {
  line-height: 1.2;
}

.icon {
  display: inline-flex;
  align-items: center;
}

.delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-inline-start: 2px;
  background: transparent;
  border: 0;
  border-radius: var(--ku-radius-full);
  color: inherit;
  cursor: pointer;
  opacity: 0.8;
}
.delete:hover {
  opacity: 1;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Chip/Chip.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Write stories** — `src/components/Chip/Chip.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
} satisfies Meta<typeof Chip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Chip' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Chip label="Solid" tone="primary" />
      <Chip label="Neutral" />
      <Chip label="Outline" variant="outline" />
      <Chip label="Danger" tone="danger" />
      <Chip label="Clickable" onClick={() => {}} tone="primary" />
      <Chip label="Apple" onDelete={() => {}} />
      <Chip label="Small" size="sm" />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Chip/index.ts`

```ts
export { Chip } from './Chip';
export type { ChipProps, ChipVariant, ChipTone, ChipSize } from './Chip';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, add:

```ts
export { Chip } from './components/Chip';
export type { ChipProps, ChipVariant, ChipTone, ChipSize } from './components/Chip';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/Chip src/index.ts
git commit -m "feat: add Chip component"
```

---

## Task 5: Avatar

**Files:**

- Create: `src/components/Avatar/Avatar.tsx`, `Avatar.module.css`, `Avatar.test.tsx`, `Avatar.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Avatar/Avatar.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders an image with alt and src when src is provided', () => {
    render(<Avatar src="/me.png" alt="My photo" />);
    const img = screen.getByRole('img', { name: 'My photo' });
    expect(img).toHaveAttribute('src', '/me.png');
  });

  it('renders up to two uppercase initials from name when no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('labels the initials avatar with the name', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument();
  });

  it('reflects size and shape as data attributes', () => {
    const { container } = render(<Avatar name="Ada" size="lg" shape="square" />);
    const root = container.querySelector('[data-size]')!;
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-shape', 'square');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Avatar/Avatar.test.tsx`
Expected: FAIL — cannot resolve `./Avatar`.

- [ ] **Step 3: Write the component** — `src/components/Avatar/Avatar.tsx`

```tsx
import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '../../utils/cx';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image URL. When set, an <img> is rendered. */
  src?: string;
  /** Alt text for the image. Required (for a11y) when src is set. */
  alt?: string;
  /** Used to derive initials and the aria-label when there is no image. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
  style?: CSSProperties;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, name, size = 'md', shape = 'circle', className, style },
  ref,
) {
  const dataAttrs = { 'data-size': size, 'data-shape': shape };
  const classes = cx(styles.root, className);

  return (
    <span
      ref={ref}
      className={classes}
      style={style}
      aria-label={!src && name ? name : undefined}
      {...dataAttrs}
    >
      {src ? (
        <img className={styles.image} src={src} alt={alt ?? ''} />
      ) : name ? (
        <span className={styles.initials} aria-hidden>
          {initialsOf(name)}
        </span>
      ) : null}
    </span>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/Avatar/Avatar.module.css`

```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--ku-color-bg-raised);
  color: var(--ku-color-text-primary);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-semibold);
  user-select: none;
  flex-shrink: 0;
}

.root[data-shape='circle'] {
  border-radius: var(--ku-radius-full);
}
.root[data-shape='square'] {
  border-radius: var(--ku-radius-md);
}

.root[data-size='sm'] {
  width: 32px;
  height: 32px;
  font-size: var(--ku-font-size-xs);
}
.root[data-size='md'] {
  width: 40px;
  height: 40px;
  font-size: var(--ku-font-size-sm);
}
.root[data-size='lg'] {
  width: 56px;
  height: 56px;
  font-size: var(--ku-font-size-lg);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  line-height: 1;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Avatar/Avatar.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Write stories** — `src/components/Avatar/Avatar.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: 'Ada Lovelace' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Grace Hopper" size="md" />
      <Avatar name="Alan Turing" size="lg" />
      <Avatar name="Ada Lovelace" shape="square" />
      <Avatar
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%235B9DFF'/%3E%3C/svg%3E"
        alt="Sample"
        size="lg"
      />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Avatar/index.ts`

```ts
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize, AvatarShape } from './Avatar';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, add:

```ts
export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize, AvatarShape } from './components/Avatar';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/Avatar src/index.ts
git commit -m "feat: add Avatar component"
```

---

## Task 6: StatusBadge

**Files:**

- Create: `src/components/StatusBadge/StatusBadge.tsx`, `StatusBadge.module.css`, `StatusBadge.test.tsx`, `StatusBadge.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/StatusBadge/StatusBadge.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('always renders a text label (color is never the only signal)', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('uses the default label for each status', () => {
    const { rerender } = render(<StatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    rerender(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    rerender(<StatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('allows a custom label', () => {
    render(<StatusBadge status="active" label="Online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('reflects status and variant as data attributes', () => {
    const { container } = render(<StatusBadge status="error" variant="outline" />);
    const root = container.querySelector('[data-status]')!;
    expect(root).toHaveAttribute('data-status', 'error');
    expect(root).toHaveAttribute('data-variant', 'outline');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StatusBadge/StatusBadge.test.tsx`
Expected: FAIL — cannot resolve `./StatusBadge`.

- [ ] **Step 3: Write the component** — `src/components/StatusBadge/StatusBadge.tsx`

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './StatusBadge.module.css';

export type StatusBadgeStatus = 'active' | 'inactive' | 'pending' | 'error';
export type StatusBadgeVariant = 'solid' | 'outline';

const DEFAULT_LABELS: Record<StatusBadgeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  error: 'Error',
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusBadgeStatus;
  /** Overrides the default label for the status. */
  label?: string;
  variant?: StatusBadgeVariant;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status, label, variant = 'solid', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(styles.root, className)}
      data-status={status}
      data-variant={variant}
      {...props}
    >
      <span className={styles.dot} aria-hidden />
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/StatusBadge/StatusBadge.module.css`

```css
.root {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-2);
  font-family: var(--ku-font-family-base);
  font-size: var(--ku-font-size-sm);
  font-weight: var(--ku-font-weight-medium);
  padding: 2px var(--ku-space-3);
  border-radius: var(--ku-radius-full);
  border: 1px solid transparent;
}

.root[data-status='active'] {
  --badge-main: var(--ku-color-success);
}
.root[data-status='inactive'] {
  --badge-main: var(--ku-color-text-secondary);
}
.root[data-status='pending'] {
  --badge-main: var(--ku-color-warning);
}
.root[data-status='error'] {
  --badge-main: var(--ku-color-danger);
}

.root[data-variant='solid'] {
  background-color: color-mix(in srgb, var(--badge-main) 18%, transparent);
  color: var(--badge-main);
}
.root[data-variant='outline'] {
  background-color: transparent;
  color: var(--badge-main);
  border-color: var(--badge-main);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--ku-radius-full);
  background-color: var(--badge-main);
  flex-shrink: 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/StatusBadge/StatusBadge.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Write stories** — `src/components/StatusBadge/StatusBadge.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
} satisfies Meta<typeof StatusBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { status: 'active' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="error" />
      <StatusBadge status="active" variant="outline" />
      <StatusBadge status="error" label="Failed" />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/StatusBadge/index.ts`

```ts
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusBadgeStatus, StatusBadgeVariant } from './StatusBadge';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, add:

```ts
export { StatusBadge } from './components/StatusBadge';
export type {
  StatusBadgeProps,
  StatusBadgeStatus,
  StatusBadgeVariant,
} from './components/StatusBadge';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/StatusBadge src/index.ts
git commit -m "feat: add StatusBadge component"
```

---

## Task 7: Alert

**Files:**

- Create: `src/components/Alert/Alert.tsx`, `Alert.module.css`, `Alert.test.tsx`, `Alert.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Alert/Alert.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders children and an optional title', () => {
    render(
      <Alert severity="info" title="Heads up">
        Something happened
      </Alert>,
    );
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('uses role="alert" for error and warning, role="status" for info and success', () => {
    const { rerender } = render(<Alert severity="error">e</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Alert severity="warning">w</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Alert severity="info">i</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Alert severity="success">s</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('reflects severity as a data attribute', () => {
    render(<Alert severity="success">ok</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('data-severity', 'success');
  });

  it('shows a labelled close button that fires onClose when closable', async () => {
    const onClose = vi.fn();
    render(
      <Alert severity="info" closable onClose={onClose}>
        msg
      </Alert>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no close button when not closable', () => {
    render(<Alert severity="info">msg</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Alert/Alert.test.tsx`
Expected: FAIL — cannot resolve `./Alert`.

- [ ] **Step 3: Write the component** — `src/components/Alert/Alert.tsx`

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Alert.module.css';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

const DEFAULT_ICONS: Record<AlertSeverity, ReactNode> = {
  info: <InfoIcon />,
  success: <CheckIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  severity: AlertSeverity;
  /** Bold heading shown above the message. */
  title?: ReactNode;
  /** Overrides the default severity icon. */
  icon?: ReactNode;
  /** Show a close button. */
  closable?: boolean;
  /** Called when the close button is clicked. */
  onClose?: () => void;
  /** Accessible label for the close button. Defaults to "Close". */
  closeLabel?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    severity,
    title,
    icon,
    closable = false,
    onClose,
    closeLabel = 'Close',
    className,
    children,
    ...props
  },
  ref,
) {
  const role = severity === 'error' || severity === 'warning' ? 'alert' : 'status';
  return (
    <div
      ref={ref}
      role={role}
      data-severity={severity}
      className={cx(styles.root, className)}
      {...props}
    >
      <span className={styles.icon} aria-hidden>
        {icon ?? DEFAULT_ICONS[severity]}
      </span>
      <div className={styles.content}>
        {title ? <div className={styles.title}>{title}</div> : null}
        <div className={styles.message}>{children}</div>
      </div>
      {closable ? (
        <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
          <CloseIcon size={18} />
        </button>
      ) : null}
    </div>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/Alert/Alert.module.css`

```css
.root {
  display: flex;
  align-items: flex-start;
  gap: var(--ku-space-3);
  padding: var(--ku-space-3) var(--ku-space-4);
  border-radius: var(--ku-radius-md);
  border: 1px solid transparent;
  font-family: var(--ku-font-family-base);
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-primary);
}

.root[data-severity='info'] {
  --alert-main: var(--ku-color-info);
}
.root[data-severity='success'] {
  --alert-main: var(--ku-color-success);
}
.root[data-severity='warning'] {
  --alert-main: var(--ku-color-warning);
}
.root[data-severity='error'] {
  --alert-main: var(--ku-color-danger);
}

.root {
  background-color: color-mix(in srgb, var(--alert-main) 14%, transparent);
  border-color: color-mix(in srgb, var(--alert-main) 40%, transparent);
}

.icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--alert-main);
  margin-top: 1px;
}

.content {
  flex: 1;
  min-width: 0;
}

.title {
  font-weight: var(--ku-font-weight-semibold);
  margin-bottom: 2px;
}

.message {
  line-height: var(--ku-line-height-base);
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--ku-radius-sm);
  color: var(--ku-color-text-secondary);
  cursor: pointer;
}
.close:hover {
  color: var(--ku-color-text-primary);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Alert/Alert.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Write stories** — `src/components/Alert/Alert.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { severity: 'info', title: 'Heads up', children: 'This is an informational alert.' },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert severity="info" title="Info">
        An informational message.
      </Alert>
      <Alert severity="success" title="Saved">
        Your changes were saved.
      </Alert>
      <Alert severity="warning" title="Careful">
        This action needs attention.
      </Alert>
      <Alert severity="error" title="Error" closable onClose={() => {}}>
        Something went wrong.
      </Alert>
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Alert/index.ts`

```ts
export { Alert } from './Alert';
export type { AlertProps, AlertSeverity } from './Alert';
```

- [ ] **Step 8: Export from the package entry**

In `src/index.ts`, add:

```ts
export { Alert } from './components/Alert';
export type { AlertProps, AlertSeverity } from './components/Alert';
```

- [ ] **Step 9: Verify typecheck + lint**

Run: `npm run typecheck` → Expected: PASS.
Run: `npm run lint` → Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/Alert src/index.ts
git commit -m "feat: add Alert component"
```

---

## Task 8: Component accessibility e2e (both themes)

**Files:**

- Create: `e2e/components.spec.ts`

This reuses the Phase-0 pattern: navigate to each component's `Showcase` story in the Storybook iframe, run axe, expect zero violations, in both dark and light. The two document-structure rules (`landmark-one-main`, `page-has-heading-one`) are disabled because Storybook story fragments are not full pages — same justification as `e2e/foundations.spec.ts`.

- [ ] **Step 1: Write the test** — `e2e/components.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Story fragments lack page-level <main>/<h1>; those rules are not about the components.
const DISABLED_RULES = ['landmark-one-main', 'page-has-heading-one'];

const STORY_IDS = [
  'components-button--showcase',
  'components-loadingbutton--showcase',
  'components-chip--showcase',
  'components-avatar--showcase',
  'components-statusbadge--showcase',
  'components-alert--showcase',
];

for (const id of STORY_IDS) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${id} has no axe violations (${theme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      await page.locator('#storybook-root').waitFor();
      // Let the story paint.
      await page.waitForTimeout(150);
      const results = await new AxeBuilder({ page }).disableRules(DISABLED_RULES).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
```

- [ ] **Step 2: Run the e2e a11y suite**

Run: `npm run test:e2e -- e2e/components.spec.ts`
Expected: Playwright auto-starts Storybook (prestorybook regenerates theme.css), runs 12 tests (6 components × 2 themes), all PASS with zero violations.

> If a real violation appears (e.g. an icon-only control missing a label, or insufficient contrast), FIX the component (not the test). Report any contrast failures — the token may need adjustment. Do NOT add component IDs to `DISABLED_RULES`.

- [ ] **Step 3: Commit**

```bash
git add e2e/components.spec.ts
git commit -m "test: add axe a11y e2e for Phase 1 components (both themes)"
```

---

## Task 9: Visual regression snapshots

**Files:**

- Create: `e2e/snapshots.spec.ts`
- Modify: `package.json` (add `test:e2e:update` script)
- Create (generated baselines): `e2e/snapshots.spec.ts-snapshots/*.png`

- [ ] **Step 1: Add the update script to `package.json`**

In the `scripts` block, add (next to `test:e2e`):

```json
    "test:e2e:update": "playwright test --update-snapshots",
```

- [ ] **Step 2: Write the snapshot spec** — `e2e/snapshots.spec.ts`

```ts
import { test, expect } from '@playwright/test';

const STORY_IDS = [
  'components-button--showcase',
  'components-loadingbutton--showcase',
  'components-chip--showcase',
  'components-avatar--showcase',
  'components-statusbadge--showcase',
  'components-alert--showcase',
];

for (const id of STORY_IDS) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${id} visual (${theme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      const root = page.locator('#storybook-root');
      await root.waitFor();
      // Disable the spinner animation so the LoadingButton snapshot is deterministic.
      await page.addStyleTag({
        content: '*{ animation: none !important; transition: none !important; }',
      });
      await page.waitForTimeout(150);
      await expect(root).toHaveScreenshot(`${id}-${theme}.png`);
    });
  }
}
```

- [ ] **Step 3: Generate the baselines**

Run: `npm run test:e2e:update -- e2e/snapshots.spec.ts`
Expected: Playwright creates `e2e/snapshots.spec.ts-snapshots/<id>-<theme>-chromium-<platform>.png` for all 12 (6 components × 2 themes) and the run passes (baselines just written).

> Note: baselines are platform-specific (the filename includes the platform, e.g. `-win32`). They are committed so CI on the same platform can diff against them. `test-results/` and `playwright-report/` remain gitignored; the `*-snapshots/` baseline directory is NOT gitignored and must be committed.

- [ ] **Step 4: Re-run to confirm baselines match**

Run: `npm run test:e2e -- e2e/snapshots.spec.ts`
Expected: 12 tests PASS (compared against the just-generated baselines).

- [ ] **Step 5: Commit (including the baseline PNGs)**

```bash
git add package.json e2e/snapshots.spec.ts "e2e/snapshots.spec.ts-snapshots"
git commit -m "test: add visual regression snapshots for Phase 1 components"
```

---

## Task 10: README usage docs + full verification gate

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add a consumer Usage section to `README.md`**

Insert the following section immediately AFTER the `## Develop` code block and BEFORE the `## Architecture` heading (this documents the two-stylesheet import the final Phase-0 review flagged, plus a component example):

````markdown
## Usage (in a consuming app)

Wrap your app once and import BOTH stylesheets — `theme.css` (the design tokens as
CSS variables) and `styles.css` (the component + reset styles). Both are required:

​```tsx
import { KoduhThemeProvider, Button, Alert } from '@koduhai/design-system';
import '@koduhai/design-system/theme.css';
import '@koduhai/design-system/styles.css';

export function App() {
return (
<KoduhThemeProvider defaultMode="dark">
<Alert severity="success" title="Welcome">You're all set.</Alert>
<Button onClick={() => alert('hi')}>Get started</Button>
</KoduhThemeProvider>
);
}
​```

Available components (Phase 1): `Button`, `LoadingButton`, `Chip`, `Avatar`,
`StatusBadge`, `Alert`. More arrive in later phases.
````

IMPORTANT: write the code fence above as a normal triple-backtick ` ```tsx ` block in the file (the leading `​` zero-width marks are only to escape the fence inside this plan — do NOT include them).

- [ ] **Step 2: Run the COMPLETE verification gate**

Run each and confirm the result before proceeding:

```bash
npm run typecheck     # Expected: PASS, no errors
npm run lint          # Expected: PASS, no errors
npm test              # Expected: PASS — Phase 0 (30) + Phase 1 component tests
npm run build         # Expected: dist/ produced; dist/index.css now contains the component styles
npm run test:e2e      # Expected: foundations (2) + components a11y (12) + snapshots (12) all pass
```

- [ ] **Step 3: Confirm the component CSS is in the bundle**

Run (Bash):

```bash
node -e "const s=require('fs').readFileSync('C:/dev/work/koduhai-design-system-v2/dist/index.css','utf8'); console.log('HAS_BUTTON_SCOPE', /Button_root/.test(s)); console.log('HAS_ALERT_SCOPE', /Alert_root/.test(s));"
```

Expected: both `true` — confirms the component `.module.css` files were scoped and bundled into `dist/index.css`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document consumer usage; Phase 1 components complete"
```

---

## Self-Review Notes (spec coverage)

- **§7 components** → Button (Task 2), LoadingButton (Task 3), Chip (Task 4), Avatar (Task 5), StatusBadge (Task 6), Alert (Task 7). Each implements the spec's key props and a11y notes (Button native `<button>` + `asChild` via Slot + focus ring from reset; LoadingButton `aria-busy` + disabled + SR loadingText; Chip clickable=`<button>`, labelled delete; Avatar `alt`/initials `aria-label`; StatusBadge text label always present; Alert `role` per severity + labelled close).
- **§8 clean-break API** → `tone`+`variant` vocabulary, `solid`/`outline`/`ghost`, `asChild` over `component`, controlled-friendly, every prop type exported.
- **§9 accessibility** → axe e2e both themes (Task 8); color never sole signal (StatusBadge dot + label, Alert icon + text); focus-visible from the Phase-0 reset.
- **§10 testing** → Vitest unit per component, axe e2e (Task 8), visual snapshots (Task 9).
- **§11 build** → component `.module.css` scoped + bundled into `dist/index.css` (verified in Task 10 Step 3).
- **Carried-forward review notes** → component-named module files (convention followed); two-stylesheet consumer import documented (Task 10); `disableRules` kept scoped to the documented document-structure rules only (Task 8).

**Deferred to later phases:** TextField/Card/EmptyState/PageHeader (Phase 2), AppBar/Sidebar (Phase 3), MIGRATION.md + bundle/tree-shaking audit + v1.0.0 release (Phase 4).
