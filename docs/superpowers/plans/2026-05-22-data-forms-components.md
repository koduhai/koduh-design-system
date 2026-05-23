# Phase 8 — Data & Forms Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four components — `Textarea`, `Progress`, `Pagination`, and `Table` — to `@koduhai/design-system`, following the established Button/TextField reference patterns, with full unit, type, and axe coverage in both themes.

**Architecture:** Each component is a self-contained folder under `src/components/<Name>/` with the five standard files (`Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`, `index.ts`). Styling uses data-attribute selectors + `--ku-*` CSS variables only. Textarea mirrors TextField's controllable contract; Table is a generic data-driven component composing the existing `Checkbox`/`Skeleton`; Pagination's page-window math lives in a pure, separately-tested helper. The four are mutually independent and can be built in parallel.

**Tech Stack:** React 18/19 (peer), TypeScript (strict), CSS Modules, Vitest + Testing Library, Playwright + axe-core, Storybook.

**Spec:** `docs/superpowers/specs/2026-05-22-data-forms-components-design.md`

**Conventions reference (read before starting):**

- `src/components/TextField/TextField.tsx` + `.module.css` + `.test.tsx` — controllable input pattern, `aria-describedby`/`aria-invalid` wiring, error/helper swap.
- `src/components/Tabs/Tabs.tsx` + `Tabs.stories.tsx` + `index.ts` — data-driven `items` pattern, `Default` + `Showcase` stories, barrel exports.
- `src/components/Checkbox/Checkbox.tsx` — `indeterminate` set on the DOM node via ref; `onChange(checked, event)`.
- `src/components/Skeleton/Skeleton.tsx` — `<Skeleton />` defaults to a text-line placeholder.
- The repo has **no** `react-hooks/exhaustive-deps` ESLint rule — do not add `eslint-disable` comments for it.
- `noUncheckedIndexedAccess` is on — indexing a record yields `T | undefined`; guard with `?? ''` etc.
- Inline `--ku-*`/dynamic styles need an `as CSSProperties` cast where TS can't infer.
- DOM-prop collisions must be `Omit`-ted from the extended HTML attributes interface (e.g. `size`, `value`, `defaultValue`, `onChange`, `role`, `children`).

**Per-component definition of done:** `npx vitest run <file>` green, `npm run typecheck` clean, story renders, axe entry added; commit after each task.

---

## File Structure

```
src/components/Textarea/   Textarea.tsx  .module.css  .test.tsx  .stories.tsx  index.ts
src/components/Progress/   Progress.tsx  .module.css  .test.tsx  .stories.tsx  index.ts
src/components/Pagination/ Pagination.tsx getPaginationRange.ts (+ .test.tsx)
                           Pagination.module.css  Pagination.test.tsx  .stories.tsx  index.ts
src/components/Table/      Table.tsx  Table.module.css  Table.test.tsx  Table.stories.tsx  index.ts
src/index.ts               + Phase 8 export block (modify)
e2e/components.spec.ts     + 4 COMPONENTS entries (modify)
```

---

## Task 1: Pagination range helper (pure function, TDD)

This is pure logic with the trickiest edge cases, so it ships first and standalone.

**Files:**

- Create: `src/components/Pagination/getPaginationRange.ts`
- Test: `src/components/Pagination/getPaginationRange.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/components/Pagination/getPaginationRange.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getPaginationRange } from './getPaginationRange';

describe('getPaginationRange', () => {
  it('returns a single page when count is 1', () => {
    expect(getPaginationRange({ count: 1, page: 1 })).toEqual([1]);
  });

  it('lists every page with no ellipsis when they all fit', () => {
    expect(getPaginationRange({ count: 5, page: 1 })).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows a trailing ellipsis near the start (window pads to 5 leading pages)', () => {
    expect(getPaginationRange({ count: 20, page: 1 })).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('shows a leading ellipsis near the end (window pads to 5 trailing pages)', () => {
    expect(getPaginationRange({ count: 20, page: 20 })).toEqual([
      1,
      'ellipsis',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('shows both ellipses around a middle page', () => {
    expect(getPaginationRange({ count: 20, page: 10 })).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ]);
  });

  it('collapses a single-page gap into the page number instead of an ellipsis', () => {
    // page 3 of 7: gap between boundary(1) and sibling-start(2) is one page → show "2", not "…"
    expect(getPaginationRange({ count: 7, page: 4 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('honours siblingCount', () => {
    expect(getPaginationRange({ count: 20, page: 10, siblingCount: 2 })).toEqual([
      1,
      'ellipsis',
      8,
      9,
      10,
      11,
      12,
      'ellipsis',
      20,
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Pagination/getPaginationRange.test.ts`
Expected: FAIL — "Failed to resolve import './getPaginationRange'".

- [ ] **Step 3: Implement the helper**

`src/components/Pagination/getPaginationRange.ts`:

```ts
export type PaginationItem = number | 'ellipsis';

export interface PaginationRangeOptions {
  /** Total number of pages (>= 1). */
  count: number;
  /** Current page, 1-based. */
  page: number;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages shown at each end. Default 1. */
  boundaryCount?: number;
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/**
 * Computes the ordered list of page numbers and ellipsis markers to render.
 * Mirrors the well-known MUI usePagination algorithm: a one-page gap is
 * rendered as the page itself rather than an ellipsis.
 */
export function getPaginationRange({
  count,
  page,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): PaginationItem[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : count - 1,
  );

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ['ellipsis' as const]
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? ['ellipsis' as const]
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/Pagination/getPaginationRange.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Pagination/getPaginationRange.ts src/components/Pagination/getPaginationRange.test.ts
git commit -m "feat(pagination): add page-window range helper"
```

---

## Task 2: Pagination component

**Files:**

- Create: `src/components/Pagination/Pagination.tsx`, `Pagination.module.css`, `Pagination.test.tsx`, `Pagination.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Pagination/Pagination.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders a labelled navigation landmark', () => {
    render(<Pagination count={5} page={1} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination count={5} page={3} />);
    const current = screen.getByRole('button', { name: 'Go to page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange with the clicked page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={1} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination count={5} page={1} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination count={5} page={5} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('prev/next move by one page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not fire when clicking the current page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders ellipses as inert, non-button nodes', () => {
    render(<Pagination count={20} page={10} />);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
    // ellipsis is not a button
    expect(screen.queryByRole('button', { name: '…' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Pagination/Pagination.test.tsx`
Expected: FAIL — cannot resolve `./Pagination`.

- [ ] **Step 3: Implement the component**

`src/components/Pagination/Pagination.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { getPaginationRange } from './getPaginationRange';
import styles from './Pagination.module.css';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Total number of pages (>= 1). */
  count: number;
  /** Current page, 1-based. */
  page: number;
  /** Fires with the requested page. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages shown at each end. Default 1. */
  boundaryCount?: number;
  /** Disables all controls. */
  disabled?: boolean;
}

export const Pagination = /* @__PURE__ */ forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      count,
      page,
      onPageChange,
      siblingCount = 1,
      boundaryCount = 1,
      disabled = false,
      className,
      'aria-label': ariaLabel = 'Pagination',
      ...props
    },
    ref,
  ) {
    const items = getPaginationRange({ count, page, siblingCount, boundaryCount });

    const go = (target: number) => {
      if (disabled || target < 1 || target > count || target === page) return;
      onPageChange?.(target);
    };

    return (
      <nav ref={ref} className={cx(styles.root, className)} aria-label={ariaLabel} {...props}>
        <ul className={styles.list}>
          <li>
            <button
              type="button"
              className={styles.item}
              aria-label="Previous page"
              disabled={disabled || page <= 1}
              onClick={() => go(page - 1)}
            >
              ‹
            </button>
          </li>
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <li key={`ellipsis-${index}`}>
                <span className={styles.ellipsis} aria-hidden="true">
                  …
                </span>
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={styles.item}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  data-current={item === page ? 'true' : undefined}
                  disabled={disabled}
                  onClick={() => go(item)}
                >
                  {item}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              className={styles.item}
              aria-label="Next page"
              disabled={disabled || page >= count}
              onClick={() => go(page + 1)}
            >
              ›
            </button>
          </li>
        </ul>
      </nav>
    );
  },
);
```

- [ ] **Step 4: Write the styles**

`src/components/Pagination/Pagination.module.css`:

```css
.root {
  font-family: var(--ku-font-family-base);
}

.list {
  display: flex;
  align-items: center;
  gap: var(--ku-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--ku-space-2);
  border: 1px solid var(--ku-color-border);
  border-radius: var(--ku-radius-md);
  background-color: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
  font-family: inherit;
  font-size: var(--ku-font-size-sm);
  cursor: pointer;
  transition:
    background-color var(--ku-duration-fast) var(--ku-easing-standard),
    border-color var(--ku-duration-fast) var(--ku-easing-standard);
}

.item:hover:not(:disabled) {
  border-color: var(--ku-color-primary);
}

.item:focus-visible {
  outline: 2px solid var(--ku-color-primary);
  outline-offset: 2px;
}

.item[data-current='true'] {
  background-color: var(--ku-color-primary);
  border-color: var(--ku-color-primary);
  color: var(--ku-color-primary-contrast);
  font-weight: var(--ku-font-weight-medium);
}

.item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  color: var(--ku-color-text-secondary);
}
```

> If `--ku-color-primary-contrast` does not exist in `tokens.ts`, substitute the token the
> Button solid variant uses for its text color (check `src/components/Button/Button.module.css`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Pagination/Pagination.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Write the barrel and stories**

`src/components/Pagination/index.ts`:

```ts
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';
export { getPaginationRange } from './getPaginationRange';
export type { PaginationItem, PaginationRangeOptions } from './getPaginationRange';
```

`src/components/Pagination/Pagination.stories.tsx`:

```tsx
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;
export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({ count, initial = 1 }: { count: number; initial?: number }) {
  const [page, setPage] = useState(initial);
  return <Pagination count={count} page={page} onPageChange={setPage} />;
}

export const Default: Story = {
  args: { count: 10, page: 1 },
  render: (args) => <Controlled count={args.count} initial={args.page} />,
};

export const Showcase: Story = {
  args: { count: 20, page: 6 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Controlled count={5} />
      <Controlled count={20} initial={6} />
      <Controlled count={20} initial={20} />
      <Pagination count={10} page={3} disabled />
    </div>
  ),
};
```

- [ ] **Step 7: Verify story renders & commit**

Run: `npx vitest run src/components/Pagination/`
Expected: PASS (both files).

```bash
git add src/components/Pagination/
git commit -m "feat(pagination): add Pagination component, stories, barrel"
```

---

## Task 3: Progress component

**Files:**

- Create: `src/components/Progress/Progress.tsx`, `Progress.module.css`, `Progress.test.tsx`, `Progress.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Progress/Progress.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes determinate value via aria attributes', () => {
    render(<Progress value={40} label="Uploading" />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('respects a custom max', () => {
    render(<Progress value={3} max={5} label="Steps" />);
    expect(screen.getByRole('progressbar', { name: 'Steps' })).toHaveAttribute(
      'aria-valuemax',
      '5',
    );
  });

  it('omits aria-valuenow when indeterminate', () => {
    render(<Progress label="Loading" />);
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
  });

  it('clamps the value to the 0..max range', () => {
    render(<Progress value={150} label="Over" />);
    expect(screen.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('renders a visible label and percentage when showValue', () => {
    render(<Progress value={25} label="Sync" showValue />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('reflects tone and size as data attributes', () => {
    render(<Progress value={50} label="X" tone="danger" size="lg" />);
    const bar = screen.getByRole('progressbar', { name: 'X' });
    expect(bar).toHaveAttribute('data-tone', 'danger');
    expect(bar.closest('[data-size]')).toHaveAttribute('data-size', 'lg');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Progress/Progress.test.tsx`
Expected: FAIL — cannot resolve `./Progress`.

- [ ] **Step 3: Implement the component**

`src/components/Progress/Progress.tsx`:

```tsx
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Progress.module.css';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Determinate progress amount. Omit for an indeterminate bar. */
  value?: number;
  /** Upper bound of `value`. Default 100. */
  max?: number;
  /** Accessible name; also shown when `showValue` is set. */
  label?: string;
  /** Render a visible label row with the percentage. Default false. */
  showValue?: boolean;
  /** Track thickness. Default 'md'. */
  size?: ProgressSize;
  /** Fill color. Default 'primary'. */
  tone?: ProgressTone;
}

export const Progress = /* @__PURE__ */ forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value,
    max = 100,
    label,
    showValue = false,
    size = 'md',
    tone = 'primary',
    className,
    ...props
  },
  ref,
) {
  const indeterminate = value == null;
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const pct = indeterminate || max <= 0 ? 0 : (clamped / max) * 100;
  const labelId = useId('progress-label');
  const showLabelBlock = showValue && label != null;

  return (
    <div className={cx(styles.root, className)} data-size={size} {...props}>
      {showLabelBlock ? (
        <div className={styles.labelRow}>
          <span id={labelId} className={styles.label}>
            {label}
          </span>
          {!indeterminate ? <span className={styles.value}>{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div
        ref={ref}
        className={styles.track}
        data-tone={tone}
        data-indeterminate={indeterminate ? 'true' : undefined}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-label={showLabelBlock ? undefined : label}
        aria-labelledby={showLabelBlock ? labelId : undefined}
      >
        <div
          className={styles.bar}
          style={indeterminate ? undefined : ({ width: `${pct}%` } as CSSProperties)}
        />
      </div>
    </div>
  );
});
```

- [ ] **Step 4: Write the styles**

`src/components/Progress/Progress.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-1);
  font-family: var(--ku-font-family-base);
}

.labelRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.label {
  font-size: var(--ku-font-size-sm);
  font-weight: var(--ku-font-weight-medium);
  color: var(--ku-color-text-primary);
}

.value {
  font-size: var(--ku-font-size-xs);
  color: var(--ku-color-text-secondary);
}

.track {
  --progress-fill: var(--ku-color-primary);
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: var(--ku-color-bg-muted, var(--ku-color-border));
  border-radius: var(--ku-radius-pill, 9999px);
}

.root[data-size='sm'] .track {
  height: 4px;
}
.root[data-size='md'] .track {
  height: 8px;
}
.root[data-size='lg'] .track {
  height: 12px;
}

.track[data-tone='primary'] {
  --progress-fill: var(--ku-color-primary);
}
.track[data-tone='neutral'] {
  --progress-fill: var(--ku-color-text-secondary);
}
.track[data-tone='success'] {
  --progress-fill: var(--ku-color-success);
}
.track[data-tone='warning'] {
  --progress-fill: var(--ku-color-warning);
}
.track[data-tone='danger'] {
  --progress-fill: var(--ku-color-danger);
}

.bar {
  height: 100%;
  background-color: var(--progress-fill);
  border-radius: inherit;
  transition: width var(--ku-duration-normal, 240ms) var(--ku-easing-standard);
}

.track[data-indeterminate='true'] .bar {
  width: 40%;
  animation: ku-progress-indeterminate 1.4s ease-in-out infinite;
}

@keyframes ku-progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
  .track[data-indeterminate='true'] .bar {
    animation: none;
    width: 100%;
    opacity: 0.4;
  }
}
```

> Token-name check: confirm `--ku-color-success` / `--ku-color-warning` / `--ku-color-danger`
> exist (grep `tokens.ts`). The `var(--x, fallback)` forms above already degrade safely if a
> token like `--ku-radius-pill` or `--ku-color-bg-muted` is absent.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Progress/Progress.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the barrel and stories**

`src/components/Progress/index.ts`:

```ts
export { Progress } from './Progress';
export type { ProgressProps, ProgressSize, ProgressTone } from './Progress';
```

`src/components/Progress/Progress.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Components/Progress',
  component: Progress,
} satisfies Meta<typeof Progress>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: 60, label: 'Uploading' } };

export const Showcase: Story = {
  args: { value: 60, label: 'Uploading' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <Progress value={25} label="Primary" showValue />
      <Progress value={50} tone="success" label="Success" showValue />
      <Progress value={75} tone="warning" label="Warning" size="lg" showValue />
      <Progress value={90} tone="danger" label="Danger" size="sm" />
      <Progress label="Indeterminate" />
    </div>
  ),
};
```

- [ ] **Step 7: Verify & commit**

Run: `npx vitest run src/components/Progress/`
Expected: PASS.

```bash
git add src/components/Progress/
git commit -m "feat(progress): add linear Progress (determinate + indeterminate)"
```

---

## Task 4: Textarea component

**Files:**

- Create: `src/components/Textarea/Textarea.tsx`, `Textarea.module.css`, `Textarea.test.tsx`, `Textarea.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Textarea/Textarea.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label with a textarea element', () => {
    render(<Textarea label="Bio" />);
    const el = screen.getByLabelText('Bio');
    expect(el.tagName).toBe('TEXTAREA');
    expect(el.id).toBeTruthy();
  });

  it('renders helper text linked via aria-describedby', () => {
    render(<Textarea label="Bio" helperText="Max 200 chars." />);
    const el = screen.getByLabelText('Bio');
    const describedBy = el.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)).toHaveTextContent('Max 200 chars.');
  });

  it('sets aria-invalid and shows errorText replacing helperText on error', () => {
    render(<Textarea label="Bio" error errorText="Required" helperText="Optional hint" />);
    const el = screen.getByLabelText('Bio');
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Optional hint')).toBeNull();
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<Textarea label="Bio" defaultValue="Hi" />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    expect(el.value).toBe('Hi');
    await userEvent.type(el, '!');
    expect(el.value).toBe('Hi!');
  });

  it('works controlled: respects value and calls onChange with the new value', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Bio" value="fixed" onChange={onChange} />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    await userEvent.type(el, 'z');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe('fixedz');
    expect(el.value).toBe('fixed'); // controlled — unchanged without parent update
  });

  it('forwards a ref to the textarea element', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea label="Bio" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('adjusts height on input when autoResize is set', async () => {
    render(<Textarea label="Bio" autoResize />);
    const el = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    // jsdom reports scrollHeight 0; stub it so the resize effect has something to read.
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 120 });
    await userEvent.type(el, 'a lot of text');
    expect(el.style.height).not.toBe('');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Textarea/Textarea.test.tsx`
Expected: FAIL — cannot resolve `./Textarea`.

- [ ] **Step 3: Implement the component**

`src/components/Textarea/Textarea.tsx`:

```tsx
import { forwardRef, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from 'react';
import { mergeRefs, useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Textarea.module.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Visible label, associated with the textarea via htmlFor/id. */
  label: string;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: TextareaSize;
  /** Grow the height to fit content. Default false. */
  autoResize?: boolean;
  /** Minimum rows when autoResize is on. Default 2. */
  minRows?: number;
  /** Maximum rows when autoResize is on; scrolls beyond. */
  maxRows?: number;
}

export const Textarea = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      value,
      defaultValue,
      onChange,
      helperText,
      error = false,
      errorText,
      size = 'md',
      autoResize = false,
      minRows = 2,
      maxRows,
      required,
      rows,
      className,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const reactId = useId('textarea');
    const id = idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });

    const description = error ? errorText : helperText;

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      const cs = window.getComputedStyle(el);
      const lineHeight = parseFloat(cs.lineHeight) || 20;
      const vPad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
      const vBorder = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) || 0;
      const minH = lineHeight * minRows + vPad + vBorder;
      const maxH = maxRows ? lineHeight * maxRows + vPad + vBorder : Infinity;
      el.style.height = 'auto';
      const next = Math.min(Math.max(el.scrollHeight, minH), maxH);
      el.style.height = `${next}px`;
      el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
    }, [state, autoResize, minRows, maxRows]);

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
        <textarea
          ref={mergeRefs(innerRef, ref)}
          id={id}
          className={styles.input}
          value={state}
          rows={autoResize ? minRows : rows}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => {
            setState(event.target.value);
            onChange?.(event.target.value, event);
          }}
          {...props}
        />
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
```

- [ ] **Step 4: Write the styles**

`src/components/Textarea/Textarea.module.css`:

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

.input {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  background-color: var(--ku-color-bg-surface);
  border: 1px solid var(--ku-color-border);
  border-radius: var(--ku-radius-md);
  color: var(--ku-color-text-primary);
  font-family: inherit;
  font-size: var(--ku-font-size-md);
  line-height: 1.5;
  transition:
    border-color var(--ku-duration-fast) var(--ku-easing-standard),
    box-shadow var(--ku-duration-fast) var(--ku-easing-standard);
}

.root[data-size='sm'] .input {
  padding: var(--ku-space-2);
  font-size: var(--ku-font-size-sm);
}
.root[data-size='md'] .input {
  padding: var(--ku-space-3);
}
.root[data-size='lg'] .input {
  padding: var(--ku-space-4);
}

.input:focus-visible {
  outline: none;
  border-color: var(--ku-color-primary);
  box-shadow: 0 0 0 1px var(--ku-color-primary);
}

.input::placeholder {
  color: var(--ku-color-text-disabled);
}

.root[data-error='true'] .input {
  border-color: var(--ku-color-danger);
}
.root[data-error='true'] .input:focus-visible {
  box-shadow: 0 0 0 1px var(--ku-color-danger);
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

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Textarea/Textarea.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Write the barrel and stories**

`src/components/Textarea/index.ts`:

```ts
export { Textarea } from './Textarea';
export type { TextareaProps, TextareaSize } from './Textarea';
```

`src/components/Textarea/Textarea.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Bio', helperText: 'A short description.' } };

export const Showcase: Story = {
  args: { label: 'Bio' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
      <Textarea label="Default" helperText="A short description." />
      <Textarea label="Required" required defaultValue="Some text" />
      <Textarea label="With error" error errorText="This field is required." />
      <Textarea
        label="Auto-resize"
        autoResize
        minRows={2}
        maxRows={6}
        defaultValue={'Line one\nLine two'}
      />
      <Textarea label="Small" size="sm" />
    </div>
  ),
};
```

- [ ] **Step 7: Verify & commit**

Run: `npx vitest run src/components/Textarea/`
Expected: PASS.

```bash
git add src/components/Textarea/
git commit -m "feat(textarea): add Textarea with TextField parity + auto-resize"
```

---

## Task 5: Table component

**Files:**

- Create: `src/components/Table/Table.tsx`, `Table.module.css`, `Table.test.tsx`, `Table.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Table/Table.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from './Table';
import type { Column } from './Table';

interface User {
  id: string;
  name: string;
  role: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada', role: 'Engineer' },
  { id: 'u2', name: 'Linus', role: 'Maintainer' },
];

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
];

const base = {
  columns,
  data: users,
  getRowId: (u: User) => u.id,
};

describe('Table', () => {
  it('renders headers and rows from columns + data', () => {
    render(<Table {...base} caption="Users" />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Maintainer' })).toBeInTheDocument();
  });

  it('uses a custom render function for a column', () => {
    const cols: Column<User>[] = [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role', render: (u) => <em>{u.role.toUpperCase()}</em> },
    ];
    render(<Table columns={cols} data={users} getRowId={(u) => u.id} />);
    expect(screen.getByText('ENGINEER')).toBeInTheDocument();
  });

  it('emits onSortChange with a toggled direction from a sortable header', async () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<Table {...base} onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
    rerender(<Table {...base} sortKey="name" sortDir="asc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith('name', 'desc');
  });

  it('reflects sort state via aria-sort on the active header', () => {
    render(<Table {...base} sortKey="name" sortDir="asc" onSortChange={() => {}} />);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('renders a selection column and toggles a single row', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...base} selectedIds={[]} onSelectionChange={onSelectionChange} />);
    const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
    await userEvent.click(rowCheckboxes[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(['u1']);
  });

  it('select-all toggles every row id', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...base} selectedIds={[]} onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['u1', 'u2']);
  });

  it('marks the select-all checkbox indeterminate when some rows are selected', () => {
    render(<Table {...base} selectedIds={['u1']} onSelectionChange={() => {}} />);
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' }) as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(true);
  });

  it('renders skeleton rows while loading', () => {
    const { container } = render(<Table {...base} loading loadingRows={3} />);
    // body rows = loadingRows; no data cell text present
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
    expect(screen.queryByText('Ada')).toBeNull();
  });

  it('renders the empty slot spanning all columns when there is no data', () => {
    render(<Table {...base} data={[]} empty={<div>No users</div>} />);
    const cell = screen.getByRole('cell', { name: 'No users' });
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('forwards a ref to the table element', () => {
    const ref = { current: null as HTMLTableElement | null };
    render(<Table {...base} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Table/Table.test.tsx`
Expected: FAIL — cannot resolve `./Table`.

- [ ] **Step 3: Implement the component**

`src/components/Table/Table.tsx`:

```tsx
import { forwardRef } from 'react';
import type { ForwardedRef, HTMLAttributes, ReactNode, Ref } from 'react';
import { Checkbox } from '../Checkbox';
import { Skeleton } from '../Skeleton';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc';
export type CellAlign = 'start' | 'center' | 'end';

export interface Column<Row> {
  /** Stable identity; also the default sort key. */
  key: string;
  /** Header cell content. */
  header: ReactNode;
  /** Custom cell renderer. Defaults to `String(row[key])` when key indexes Row. */
  render?: (row: Row, rowIndex: number) => ReactNode;
  /** Cell text alignment. Default 'start'. */
  align?: CellAlign;
  /** Any CSS width applied to the column. */
  width?: string;
  /** Makes the header a sort control. Default false. */
  sortable?: boolean;
}

export interface TableProps<Row> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Column<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;
  /** Accessible name; visually hidden unless `captionVisible`. */
  caption?: ReactNode;
  captionVisible?: boolean;
  /** Controlled sort key. */
  sortKey?: string;
  /** Controlled sort direction. */
  sortDir?: SortDirection;
  /** Fires with the requested sort key + toggled direction. */
  onSortChange?: (key: string, dir: SortDirection) => void;
  /** Controlled selected row ids. */
  selectedIds?: string[];
  /** Fires with the next selected id set. */
  onSelectionChange?: (ids: string[]) => void;
  /** Renders skeleton rows in place of data. */
  loading?: boolean;
  /** Number of skeleton rows. Default 5. */
  loadingRows?: number;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  /** Sticky header for scroll-in-container. */
  stickyHeader?: boolean;
}

function TableInner<Row>(
  {
    columns,
    data,
    getRowId,
    caption,
    captionVisible = false,
    sortKey,
    sortDir,
    onSortChange,
    selectedIds,
    onSelectionChange,
    loading = false,
    loadingRows = 5,
    empty,
    stickyHeader = false,
    className,
    ...props
  }: TableProps<Row>,
  ref: ForwardedRef<HTMLTableElement>,
) {
  const selectable = selectedIds != null && onSelectionChange != null;
  const selectedSet = new Set(selectedIds ?? []);
  const allIds = data.map(getRowId);
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const someSelected = selectable && allIds.some((id) => selectedSet.has(id)) && !allSelected;
  const totalCols = columns.length + (selectable ? 1 : 0);

  const handleSort = (col: Column<Row>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDirection = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir);
  };

  const toggleAll = () => {
    onSelectionChange?.(allSelected ? [] : allIds);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.([...next]);
  };

  const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!col.sortable) return undefined;
    if (sortKey !== col.key) return 'none';
    return sortDir === 'desc' ? 'descending' : 'ascending';
  };

  return (
    <table
      ref={ref}
      className={cx(styles.root, className)}
      data-sticky={stickyHeader ? 'true' : undefined}
      {...props}
    >
      {caption != null ? (
        <caption className={styles.caption}>
          {captionVisible ? caption : <VisuallyHidden>{caption}</VisuallyHidden>}
        </caption>
      ) : null}
      <thead className={styles.thead}>
        <tr>
          {selectable ? (
            <th scope="col" className={styles.th} data-select="true">
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </th>
          ) : null}
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={styles.th}
              data-align={col.align ?? 'start'}
              aria-sort={ariaSort(col)}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.sortable ? (
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort(col)}
                  data-active={sortKey === col.key ? 'true' : undefined}
                >
                  {col.header}
                  <span
                    className={styles.sortIcon}
                    aria-hidden="true"
                    data-dir={sortKey === col.key ? sortDir : undefined}
                  />
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, r) => (
            <tr key={`skeleton-${r}`}>
              {Array.from({ length: totalCols }).map((__, c) => (
                <td key={c} className={styles.td}>
                  <Skeleton />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td className={styles.emptyCell} colSpan={totalCols}>
              {empty}
            </td>
          </tr>
        ) : (
          data.map((row, rowIndex) => {
            const id = getRowId(row);
            const isSelected = selectedSet.has(id);
            return (
              <tr key={id} className={styles.tr} data-selected={isSelected ? 'true' : undefined}>
                {selectable ? (
                  <td className={styles.td} data-select="true">
                    <Checkbox
                      aria-label="Select row"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td key={col.key} className={styles.td} data-align={col.align ?? 'start'}>
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// Generic forwardRef: cast preserves the <Row> type parameter at the call site.
export const Table = /* @__PURE__ */ forwardRef(TableInner) as <Row>(
  props: TableProps<Row> & { ref?: Ref<HTMLTableElement> },
) => ReturnType<typeof TableInner>;
```

> Note on the `as` cast: `forwardRef` erases generics, so we cast the result back to a generic
> call signature. This is the standard React pattern for a generic + ref-forwarding component.
> `Checkbox`'s `onChange` is `(checked, event) => void`; passing a zero-arg handler is valid
> (fewer params is assignable). The default cell uses `(row as Record<string, unknown>)[col.key]`
> because `Row` is unconstrained; `?? ''` satisfies `noUncheckedIndexedAccess`.

- [ ] **Step 4: Write the styles**

`src/components/Table/Table.module.css`:

```css
.root {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--ku-font-family-base);
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-primary);
}

.caption {
  text-align: start;
  padding-bottom: var(--ku-space-2);
  color: var(--ku-color-text-secondary);
  font-size: var(--ku-font-size-sm);
}

.thead {
  border-bottom: 1px solid var(--ku-color-border);
}

.root[data-sticky='true'] .thead .th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--ku-color-bg-surface);
}

.th {
  padding: var(--ku-space-2) var(--ku-space-3);
  text-align: start;
  font-weight: var(--ku-font-weight-medium);
  color: var(--ku-color-text-secondary);
  white-space: nowrap;
}

.th[data-align='center'],
.td[data-align='center'] {
  text-align: center;
}
.th[data-align='end'],
.td[data-align='end'] {
  text-align: end;
}

.th[data-select='true'],
.td[data-select='true'] {
  width: 1%;
  white-space: nowrap;
}

.sortButton {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-1);
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;
}

.sortButton:focus-visible {
  outline: 2px solid var(--ku-color-primary);
  outline-offset: 2px;
}

.sortIcon {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  /* neutral (unsorted) shows a faint downward caret */
  border-top: 5px solid var(--ku-color-text-disabled);
  opacity: 0.6;
}
.sortIcon[data-dir='asc'] {
  border-top: 0;
  border-bottom: 5px solid var(--ku-color-primary);
  opacity: 1;
}
.sortIcon[data-dir='desc'] {
  border-bottom: 0;
  border-top: 5px solid var(--ku-color-primary);
  opacity: 1;
}

.tr {
  border-bottom: 1px solid var(--ku-color-border);
}

.tr[data-selected='true'] {
  background-color: var(--ku-color-bg-muted, rgba(127, 127, 127, 0.08));
}

.td {
  padding: var(--ku-space-2) var(--ku-space-3);
}

.emptyCell {
  padding: var(--ku-space-6) var(--ku-space-3);
  text-align: center;
  color: var(--ku-color-text-secondary);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Table/Table.test.tsx`
Expected: PASS (10 tests).

- [ ] **Step 6: Write the barrel and stories**

`src/components/Table/index.ts`:

```ts
export { Table } from './Table';
export type { TableProps, Column, SortDirection, CellAlign } from './Table';
```

`src/components/Table/Table.stories.tsx`:

```tsx
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './Table';
import type { Column, SortDirection } from './Table';
import { EmptyState } from '../EmptyState';

interface User {
  id: string;
  name: string;
  role: string;
  status: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 'u2', name: 'Linus Torvalds', role: 'Maintainer', status: 'Active' },
  { id: 'u3', name: 'Grace Hopper', role: 'Admiral', status: 'Inactive' },
];

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'end' },
];

const meta = {
  title: 'Components/Table',
  component: Table<User>,
} satisfies Meta<typeof Table<User>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { columns, data: users, getRowId: (u: User) => u.id, caption: 'Team members' },
};

function Interactive() {
  const [sortKey, setSortKey] = useState<string | undefined>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<string[]>(['u1']);

  const sorted = [...users].sort((a, b) => {
    if (!sortKey) return 0;
    const av = String(a[sortKey as keyof User]);
    const bv = String(b[sortKey as keyof User]);
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <Table
      columns={columns}
      data={sorted}
      getRowId={(u) => u.id}
      caption="Team members"
      captionVisible
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(key, dir) => {
        setSortKey(key);
        setSortDir(dir);
      }}
      selectedIds={selected}
      onSelectionChange={setSelected}
      stickyHeader
    />
  );
}

export const Showcase: Story = {
  args: { columns, data: users, getRowId: (u: User) => u.id },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Interactive />
      <Table
        columns={columns}
        data={[]}
        getRowId={(u) => u.id}
        empty={<EmptyState title="No members yet" />}
      />
      <Table columns={columns} data={users} getRowId={(u) => u.id} loading loadingRows={3} />
    </div>
  ),
};
```

> If `<Table<User>>` in the `meta`/`StoryObj` generics trips the Storybook types, fall back to
> `component: Table as typeof Table` and type the args via the `render` functions (the stories
> render explicitly anyway). Keep the `Showcase` export name — the e2e harness targets
> `components-table--showcase`.

- [ ] **Step 7: Verify & commit**

Run: `npx vitest run src/components/Table/`
Expected: PASS.

```bash
git add src/components/Table/
git commit -m "feat(table): add data-driven Table (sort, selection, loading, empty, sticky)"
```

---

## Task 6: Wire exports + e2e a11y coverage

**Files:**

- Modify: `src/index.ts` (add Phase 8 block)
- Modify: `e2e/components.spec.ts` (add 4 entries to `COMPONENTS`)

- [ ] **Step 1: Add the Phase 8 export block to `src/index.ts`**

Append after the Phase 7 block (currently ending at the `Menu` export, `src/index.ts:88`):

```ts
// Phase 8 — data & forms
export { Textarea } from './components/Textarea';
export type { TextareaProps, TextareaSize } from './components/Textarea';
export { Progress } from './components/Progress';
export type { ProgressProps, ProgressSize, ProgressTone } from './components/Progress';
export { Pagination, getPaginationRange } from './components/Pagination';
export type {
  PaginationProps,
  PaginationItem,
  PaginationRangeOptions,
} from './components/Pagination';
export { Table } from './components/Table';
export type { TableProps, Column, SortDirection, CellAlign } from './components/Table';
```

- [ ] **Step 2: Register the new stories in the e2e a11y harness**

In `e2e/components.spec.ts`, add these entries to the end of the `COMPONENTS` array
(after the `Menu` entry):

```ts
  { name: 'Textarea', storyId: 'components-textarea--showcase' },
  { name: 'Progress', storyId: 'components-progress--showcase' },
  { name: 'Pagination', storyId: 'components-pagination--showcase' },
  { name: 'Table', storyId: 'components-table--showcase' },
```

- [ ] **Step 3: Typecheck the whole project**

Run: `npm run typecheck`
Expected: no errors. If the generic `Table` story trips types, apply the fallback noted in Task 5 Step 6.

- [ ] **Step 4: Run the full unit suite**

Run: `npm test`
Expected: all tests pass (existing + the four new components).

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Run the a11y e2e suite (both themes)**

Run: `npm run test:e2e`
Expected: zero axe violations for the four new Showcase stories in dark + light. (This auto-starts Storybook, which runs `build:tokens` first via the `prestorybook` hook.)

- [ ] **Step 7: Commit**

```bash
git add src/index.ts e2e/components.spec.ts
git commit -m "feat: export Phase 8 components and add a11y e2e coverage"
```

---

## Final Verification

- [ ] `npm run typecheck` — clean
- [ ] `npm test` — all green
- [ ] `npm run lint` — clean
- [ ] `npm run test:e2e` — zero axe violations (dark + light) for Textarea, Progress, Pagination, Table
- [ ] `npm run build` — succeeds (CJS + ESM + .d.ts), confirming the new exports and CSS bundle

---

## Notes for the Implementer

- **Token names:** several CSS files reference tokens by assumed names (`--ku-color-success`,
  `--ku-color-warning`, `--ku-color-primary-contrast`, `--ku-color-bg-muted`, `--ku-radius-pill`).
  Before writing each `.module.css`, grep `src/theme/tokens.ts` for the real names and adjust.
  The `var(--x, fallback)` forms are already safe; the bare ones (`--ku-color-success` etc.) are
  not — verify them.
- **Parallel build:** Tasks 1–2 (Pagination), 3 (Progress), 4 (Textarea), and 5 (Table) are
  independent and touch disjoint files. They can be dispatched to parallel subagents; Task 6
  (shared `src/index.ts` + `e2e`) must run last, after all four land, as the integration step.
- **Reduced motion:** Progress's indeterminate animation and the Textarea/Progress transitions
  must degrade under `prefers-reduced-motion` — already encoded in the CSS above; don't drop it.
- **Color is never the only signal:** Table sort state is conveyed by `aria-sort` (not just the
  caret), the current Pagination page by `aria-current` (not just background), and Progress by
  `aria-valuenow` — keep these when adjusting styles.

```

```
