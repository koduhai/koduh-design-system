# AvatarGroup, Stat, ToggleGroup, Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four self-contained components — AvatarGroup, Stat, ToggleGroup, Drawer — closing the named P1 gaps from issue #12.

**Architecture:** Each is a standard component folder following the Button/Avatar/Dialog/Tabs reference patterns: data-attribute variant styling, `cx(styles.root, className)`, `forwardRef` + DOM-prop spread, exports wired into `src/index.ts`. AvatarGroup composes the shipped `Avatar` via `cloneElement`; Drawer reuses Dialog's native `<dialog>` + `showModal()` machinery with edge placement; ToggleGroup reuses Tabs' roving-focus implementation; Stat is presentational and composes into `Card`.

**Tech Stack:** React 18/19, TypeScript (strict, `noUncheckedIndexedAccess`), CSS Modules, Vitest + Testing Library, Playwright + axe-core, Storybook.

**Parallelism:** Tasks 1–4 are fully independent (separate folders, no shared files) and suit the parallel-subagent build workflow. Task 5 is the central integration step (touches `src/index.ts` and `e2e/components.spec.ts`) and must run after 1–4 land.

**Token reference (verified in `src/theme/tokens.ts`, exposed as `--ku-*` CSS vars):** colors `primary`, `primary-contrast`, `danger`, `success`, `warning`, `info`, `success-fg`, `danger-fg`, `warning-fg`, `bg-default`, `bg-surface`, `bg-raised`, `border`, `text-primary`, `text-secondary`, `text-disabled`. There is **no** `bg-muted`/`text-muted` token — use `bg-raised`/`text-secondary`. Spacing `--ku-space-1…8`, radii `--ku-radius-sm|md|lg|full`, `--ku-shadow-3`, `--ku-duration-fast|base`, `--ku-easing-standard`, `--ku-font-family-base`, `--ku-font-weight-medium|semibold`, `--ku-font-size-xs|sm|md|lg|2xl`, `--ku-line-height-tight|base`. If a referenced token is missing, grep `dist/theme.css` (after `npm run build:tokens`) for the nearest equivalent rather than inventing one.

**Per-file commands:**

- Single test file: `npx vitest run src/components/<Name>/<Name>.test.tsx`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`

---

## Task 1: AvatarGroup

**Files:**

- Create: `src/components/AvatarGroup/AvatarGroup.tsx`
- Create: `src/components/AvatarGroup/AvatarGroup.module.css`
- Create: `src/components/AvatarGroup/AvatarGroup.test.tsx`
- Create: `src/components/AvatarGroup/AvatarGroup.stories.tsx`
- Create: `src/components/AvatarGroup/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/AvatarGroup/AvatarGroup.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar';

describe('AvatarGroup', () => {
  it('renders all avatars when under max', () => {
    render(
      <AvatarGroup max={4}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>,
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('renders a +N overflow chip when over max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
        <Avatar name="G H" />
      </AvatarGroup>,
    );
    // max=2 reserves one slot for overflow: shows 1 avatar + "+3".
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByLabelText('3 more')).toBeInTheDocument();
  });

  it('uses total to compute the overflow count for server-truncated lists', () => {
    render(
      <AvatarGroup max={3} total={120}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
      </AvatarGroup>,
    );
    // shows max-1 = 2 avatars, overflow = 120 - 2 = 118.
    expect(screen.getByText('+118')).toBeInTheDocument();
  });

  it('propagates size to children and the overflow chip', () => {
    const { container } = render(
      <AvatarGroup max={1} size="lg">
        <Avatar name="A B" />
        <Avatar name="C D" />
      </AvatarGroup>,
    );
    const sized = container.querySelectorAll('[data-size="lg"]');
    // one rendered avatar + the overflow chip both reflect lg.
    expect(sized.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/AvatarGroup/AvatarGroup.test.tsx`
Expected: FAIL — cannot resolve `./AvatarGroup`.

- [ ] **Step 3: Write the component**

Create `src/components/AvatarGroup/AvatarGroup.tsx`:

```tsx
import { forwardRef, Children, cloneElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import type { AvatarProps, AvatarSize, AvatarShape } from '../Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Cap the number of visible avatars; the remainder collapses into a +N chip. */
  max?: number;
  /** Logical total when more avatars exist than are rendered (server-truncated lists). */
  total?: number;
  /** Propagated to every child Avatar and the overflow chip. Defaults to 'md'. */
  size?: AvatarSize;
  /** Propagated to every child Avatar and the overflow chip. Defaults to 'circle'. */
  shape?: AvatarShape;
  /** Overlap amount. Defaults to 'normal'. */
  spacing?: 'tight' | 'normal';
}

export const AvatarGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      max,
      total,
      size = 'md',
      shape = 'circle',
      spacing = 'normal',
      className,
      children,
      ...props
    },
    ref,
  ) {
    const avatars = Children.toArray(children).filter(
      isValidElement,
    ) as ReactElement<AvatarProps>[];
    const count = total ?? avatars.length;
    const hasOverflow = max != null && count > max;
    // When overflowing, reserve one slot for the +N chip.
    const visibleCount = hasOverflow ? max - 1 : avatars.length;
    const visible = avatars.slice(0, Math.max(0, visibleCount));
    const overflow = count - visible.length;

    return (
      <div ref={ref} className={cx(styles.root, className)} data-spacing={spacing} {...props}>
        {visible.map((child, index) =>
          cloneElement(child, {
            key: child.key ?? index,
            size,
            shape,
            className: cx(styles.avatar, child.props.className),
          }),
        )}
        {hasOverflow && overflow > 0 ? (
          <span
            className={cx(styles.avatar, styles.overflow)}
            data-size={size}
            data-shape={shape}
            aria-label={`${overflow} more`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
    );
  },
);
```

Create `src/components/AvatarGroup/AvatarGroup.module.css`:

```css
.root {
  display: inline-flex;
  align-items: center;
}

/* A ring in the page background colour visually separates stacked avatars. */
.avatar {
  position: relative;
  box-shadow: 0 0 0 2px var(--ku-color-bg-default);
}
.avatar:not(:first-child) {
  margin-inline-start: -8px;
}
.root[data-spacing='tight'] .avatar:not(:first-child) {
  margin-inline-start: -12px;
}

.overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--ku-radius-full);
  background-color: var(--ku-color-bg-raised);
  color: var(--ku-color-text-secondary);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-semibold);
  user-select: none;
}
.overflow[data-shape='square'] {
  border-radius: var(--ku-radius-md);
}
.overflow[data-size='sm'] {
  width: 32px;
  height: 32px;
  font-size: var(--ku-font-size-xs);
}
.overflow[data-size='md'] {
  width: 40px;
  height: 40px;
  font-size: var(--ku-font-size-sm);
}
.overflow[data-size='lg'] {
  width: 56px;
  height: 56px;
  font-size: var(--ku-font-size-lg);
}
```

Create `src/components/AvatarGroup/index.ts`:

```ts
export { AvatarGroup } from './AvatarGroup';
export type { AvatarGroupProps } from './AvatarGroup';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/AvatarGroup/AvatarGroup.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the Showcase story**

Create `src/components/AvatarGroup/AvatarGroup.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar';

const meta = {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
} satisfies Meta<typeof AvatarGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    max: 4,
    children: [
      <Avatar key="1" name="Ada Lovelace" />,
      <Avatar key="2" name="Grace Hopper" />,
      <Avatar key="3" name="Alan Turing" />,
      <Avatar key="4" name="Linus Torvalds" />,
      <Avatar key="5" name="Edsger Dijkstra" />,
    ],
  },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AvatarGroup size="sm" max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
        <Avatar name="Linus Torvalds" />
      </AvatarGroup>
      <AvatarGroup size="md" max={4} total={42}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
      </AvatarGroup>
      <AvatarGroup size="lg" shape="square" spacing="tight">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>
    </div>
  ),
};
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/AvatarGroup
git commit -m "feat(AvatarGroup): stacked avatars with +N overflow (#12)"
```

---

## Task 2: Stat

**Files:**

- Create: `src/components/Stat/Stat.tsx`
- Create: `src/components/Stat/Stat.module.css`
- Create: `src/components/Stat/Stat.test.tsx`
- Create: `src/components/Stat/Stat.stories.tsx`
- Create: `src/components/Stat/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/Stat/Stat.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renders the label and value', () => {
    render(<Stat label="MRR" value="$48.2k" />);
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('$48.2k')).toBeInTheDocument();
  });

  it('reflects the trend as a data attribute', () => {
    const { container } = render(<Stat label="Users" value="1,204" delta="12%" trend="up" />);
    const root = container.querySelector('[data-trend]')!;
    expect(root).toHaveAttribute('data-trend', 'up');
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('exposes the trend direction as accessible text (not colour-only)', () => {
    render(<Stat label="Churn" value="2.1%" delta="0.4%" trend="down" />);
    // The visually-hidden trend word makes the change direction available to AT.
    expect(screen.getByText(/Decreased/)).toBeInTheDocument();
  });

  it('renders helpText when provided', () => {
    render(<Stat label="MRR" value="$48.2k" helpText="vs. last month" />);
    expect(screen.getByText('vs. last month')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Stat/Stat.test.tsx`
Expected: FAIL — cannot resolve `./Stat`.

- [ ] **Step 3: Write the component**

Create `src/components/Stat/Stat.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Stat.module.css';

export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The metric name. */
  label: ReactNode;
  /** The metric value; rendered with tabular numerals. */
  value: ReactNode;
  /** Change indicator text, e.g. "12%". */
  delta?: ReactNode;
  /** Drives the delta colour and direction arrow. Defaults to 'neutral'. */
  trend?: StatTrend;
  /** Optional accent icon shown beside the label. */
  icon?: ReactNode;
  /** Sub-label rendered alongside the delta. */
  helpText?: ReactNode;
}

const TREND_GLYPH: Record<StatTrend, string> = { up: '↑', down: '↓', neutral: '→' };
const TREND_WORD: Record<StatTrend, string> = {
  up: 'Increased',
  down: 'Decreased',
  neutral: 'No change',
};

export const Stat = /* @__PURE__ */ forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, delta, trend = 'neutral', icon, helpText, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cx(styles.root, className)} data-trend={trend} {...props}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon ? (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <div className={styles.value}>{value}</div>
      {delta != null || helpText != null ? (
        <div className={styles.footer}>
          {delta != null ? (
            <span className={styles.delta}>
              <span className={styles.arrow} aria-hidden>
                {TREND_GLYPH[trend]}
              </span>
              <VisuallyHidden>{TREND_WORD[trend]}: </VisuallyHidden>
              {delta}
            </span>
          ) : null}
          {helpText != null ? <span className={styles.help}>{helpText}</span> : null}
        </div>
      ) : null}
    </div>
  );
});
```

Create `src/components/Stat/Stat.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--ku-space-1);
  font-family: var(--ku-font-family-base);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ku-space-2);
}
.label {
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-secondary);
}
.icon {
  display: inline-flex;
  color: var(--ku-color-text-secondary);
}

.value {
  font-size: var(--ku-font-size-2xl);
  font-weight: var(--ku-font-weight-semibold);
  color: var(--ku-color-text-primary);
  line-height: var(--ku-line-height-tight);
  font-variant-numeric: tabular-nums;
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  font-size: var(--ku-font-size-sm);
}
.delta {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-1);
  font-weight: var(--ku-font-weight-medium);
}
.root[data-trend='up'] .delta {
  color: var(--ku-color-success-fg);
}
.root[data-trend='down'] .delta {
  color: var(--ku-color-danger-fg);
}
.root[data-trend='neutral'] .delta {
  color: var(--ku-color-text-secondary);
}
.help {
  color: var(--ku-color-text-secondary);
}
```

Create `src/components/Stat/index.ts`:

```ts
export { Stat } from './Stat';
export type { StatProps, StatTrend } from './Stat';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Stat/Stat.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the Showcase story**

Create `src/components/Stat/Stat.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from './Stat';
import { Card } from '../Card';

const meta = {
  title: 'Components/Stat',
  component: Stat,
} satisfies Meta<typeof Stat>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'MRR', value: '$48.2k', delta: '12%', trend: 'up', helpText: 'vs. last month' },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720 }}>
      <Card>
        <Stat label="MRR" value="$48.2k" delta="12%" trend="up" helpText="vs. last month" />
      </Card>
      <Card>
        <Stat label="Churn" value="2.1%" delta="0.4%" trend="down" helpText="vs. last month" />
      </Card>
      <Card>
        <Stat label="Active users" value="1,204" delta="0%" trend="neutral" />
      </Card>
    </div>
  ),
};
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors. (If `--ku-font-size-2xl` is absent in `dist/theme.css`, substitute `--ku-font-size-xl`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/Stat
git commit -m "feat(Stat): dashboard metric block with trend (#12)"
```

---

## Task 3: ToggleGroup

**Files:**

- Create: `src/components/ToggleGroup/ToggleGroup.tsx`
- Create: `src/components/ToggleGroup/ToggleGroup.module.css`
- Create: `src/components/ToggleGroup/ToggleGroup.test.tsx`
- Create: `src/components/ToggleGroup/ToggleGroup.stories.tsx`
- Create: `src/components/ToggleGroup/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/ToggleGroup/ToggleGroup.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup } from './ToggleGroup';

const ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board', disabled: true },
];

describe('ToggleGroup', () => {
  it('single: exposes a radiogroup of radios', () => {
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
  });

  it('single: clicking an item selects it and fires onChange with the value', async () => {
    const onChange = vi.fn();
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(onChange).toHaveBeenCalledWith('grid');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
  });

  it('multiple: toggles membership and fires onChange with an array', async () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup type="multiple" items={ITEMS} defaultValue={['list']} onChange={onChange} />,
    );
    const grid = screen.getByRole('button', { name: 'Grid' });
    expect(screen.getByRole('group')).toBeInTheDocument();
    await userEvent.click(grid);
    expect(onChange).toHaveBeenLastCalledWith(['list', 'grid']);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(grid);
    expect(onChange).toHaveBeenLastCalledWith(['list']);
  });

  it('does not select a disabled item', async () => {
    const onChange = vi.fn();
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" onChange={onChange} />);
    const board = screen.getByRole('radio', { name: 'Board' });
    expect(board).toBeDisabled();
    await userEvent.click(board);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('roving focus: arrow key moves to and selects the next enabled item (single)', async () => {
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" />);
    const list = screen.getByRole('radio', { name: 'List' });
    list.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ToggleGroup/ToggleGroup.test.tsx`
Expected: FAIL — cannot resolve `./ToggleGroup`.

- [ ] **Step 3: Write the component**

Create `src/components/ToggleGroup/ToggleGroup.tsx`:

```tsx
import { forwardRef, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './ToggleGroup.module.css';

export type ToggleGroupSize = 'sm' | 'md' | 'lg';
export type ToggleGroupTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';

export interface ToggleGroupItem {
  /** Stable identity; the controlled/uncontrolled value. */
  value: string;
  /** Visible content. Omit only when an icon-only item supplies `aria-label`. */
  label?: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Disables this item. */
  disabled?: boolean;
  /** Accessible name — required for icon-only items. */
  'aria-label'?: string;
}

export interface ToggleGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Item definitions. */
  items: ToggleGroupItem[];
  /** Selection mode. 'single' → radiogroup; 'multiple' → toggle-button group. Defaults to 'single'. */
  type?: 'single' | 'multiple';
  /** Controlled value: a string for 'single', a string[] for 'multiple'. */
  value?: string | string[];
  /** Uncontrolled initial value. */
  defaultValue?: string | string[];
  /** Fires with the next selection (string for 'single', string[] for 'multiple'). */
  onChange?: (value: string | string[]) => void;
  /** Defaults to 'md'. */
  size?: ToggleGroupSize;
  /** Shared tone vocabulary. Defaults to 'primary'. */
  tone?: ToggleGroupTone;
  /** Disables every item. */
  disabled?: boolean;
  /** Layout/keyboard axis. Defaults to 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
}

export const ToggleGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup(
    {
      items,
      type = 'single',
      value,
      defaultValue,
      onChange,
      size = 'md',
      tone = 'primary',
      disabled = false,
      orientation = 'horizontal',
      className,
      ...props
    },
    ref,
  ) {
    const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const [selected, setSelected] = useControllableState<string | string[]>({
      value,
      defaultValue: defaultValue ?? (type === 'multiple' ? [] : ''),
      onChange: undefined,
    });

    const isSelected = (val: string): boolean =>
      type === 'multiple' ? (selected as string[]).includes(val) : selected === val;

    const toggle = (val: string) => {
      if (type === 'multiple') {
        const current = selected as string[];
        const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
        setSelected(next);
        onChange?.(next);
      } else {
        setSelected(val);
        onChange?.(val);
      }
    };

    const enabledIndexes = items.reduce<number[]>((acc, item, index) => {
      if (!item.disabled && !disabled) acc.push(index);
      return acc;
    }, []);

    // Initially-tabbable item: the first selected enabled item, else first enabled.
    const firstSelected = items.findIndex((item) => !item.disabled && isSelected(item.value));
    const [activeIndex, setActiveIndex] = useState(
      firstSelected >= 0 ? firstSelected : (enabledIndexes[0] ?? 0),
    );

    const focusAt = (index: number) => {
      setActiveIndex(index);
      btnRefs.current[index]?.focus();
      // 'single' uses radio auto-activation: moving focus also selects.
      if (type === 'single') {
        const item = items[index];
        if (item) toggle(item.value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      if (enabledIndexes.length === 0) return;
      const pos = enabledIndexes.indexOf(index);

      let target: number | null = null;
      if (event.key === nextKey) {
        const n = pos === -1 ? 0 : (pos + 1) % enabledIndexes.length;
        target = enabledIndexes[n] ?? null;
      } else if (event.key === prevKey) {
        const p =
          pos === -1
            ? enabledIndexes.length - 1
            : (pos - 1 + enabledIndexes.length) % enabledIndexes.length;
        target = enabledIndexes[p] ?? null;
      } else if (event.key === 'Home') {
        target = enabledIndexes[0] ?? null;
      } else if (event.key === 'End') {
        target = enabledIndexes[enabledIndexes.length - 1] ?? null;
      }

      if (target !== null) {
        event.preventDefault();
        focusAt(target);
      }
    };

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        role={type === 'single' ? 'radiogroup' : 'group'}
        aria-orientation={orientation}
        data-size={size}
        data-tone={tone}
        data-orientation={orientation}
        {...props}
      >
        {items.map((item, index) => {
          const checked = isSelected(item.value);
          const itemDisabled = disabled || item.disabled;
          return (
            <button
              key={item.value}
              ref={(node) => {
                btnRefs.current[index] = node;
              }}
              type="button"
              role={type === 'single' ? 'radio' : undefined}
              aria-checked={type === 'single' ? checked : undefined}
              aria-pressed={type === 'multiple' ? checked : undefined}
              aria-label={item['aria-label']}
              className={styles.item}
              disabled={itemDisabled}
              data-selected={checked ? 'true' : undefined}
              tabIndex={index === activeIndex ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => {
                if (itemDisabled) return;
                setActiveIndex(index);
                toggle(item.value);
              }}
            >
              {item.icon ? (
                <span className={styles.icon} aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </button>
          );
        })}
      </div>
    );
  },
);
```

Create `src/components/ToggleGroup/ToggleGroup.module.css`:

```css
.root {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--ku-color-border);
  border-radius: var(--ku-radius-md);
  background-color: var(--ku-color-bg-surface);
}
.root[data-orientation='vertical'] {
  flex-direction: column;
}

/* Tone bridge: selected fill + its readable foreground. */
.root[data-tone='primary'] {
  --tg-main: var(--ku-color-primary);
  --tg-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='neutral'] {
  --tg-main: var(--ku-color-text-primary);
  --tg-contrast: var(--ku-color-bg-default);
}
.root[data-tone='success'] {
  --tg-main: var(--ku-color-success);
  --tg-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='warning'] {
  --tg-main: var(--ku-color-warning);
  --tg-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='danger'] {
  --tg-main: var(--ku-color-danger);
  --tg-contrast: var(--ku-color-primary-contrast);
}

.item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ku-space-2);
  border: none;
  border-radius: var(--ku-radius-sm);
  background: transparent;
  color: var(--ku-color-text-secondary);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ku-duration-fast) var(--ku-easing-standard),
    color var(--ku-duration-fast) var(--ku-easing-standard);
}
.root[data-size='sm'] .item {
  padding: var(--ku-space-1) var(--ku-space-2);
  font-size: var(--ku-font-size-xs);
}
.root[data-size='md'] .item {
  padding: var(--ku-space-2) var(--ku-space-3);
  font-size: var(--ku-font-size-sm);
}
.root[data-size='lg'] .item {
  padding: var(--ku-space-3) var(--ku-space-4);
  font-size: var(--ku-font-size-md);
}

.item:hover:not(:disabled):not([data-selected]) {
  background-color: color-mix(in srgb, var(--ku-color-text-primary) 8%, transparent);
  color: var(--ku-color-text-primary);
}
.item[data-selected] {
  background-color: var(--tg-main);
  color: var(--tg-contrast);
}
.item:focus-visible {
  outline: 2px solid var(--ku-color-primary);
  outline-offset: 2px;
}
.item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  display: inline-flex;
}
```

Create `src/components/ToggleGroup/index.ts`:

```ts
export { ToggleGroup } from './ToggleGroup';
export type {
  ToggleGroupProps,
  ToggleGroupItem,
  ToggleGroupSize,
  ToggleGroupTone,
} from './ToggleGroup';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ToggleGroup/ToggleGroup.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the Showcase story**

Create `src/components/ToggleGroup/ToggleGroup.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleGroup } from './ToggleGroup';

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
} satisfies Meta<typeof ToggleGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

const VIEW_ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

export const Default: Story = {
  args: { type: 'single', items: VIEW_ITEMS, defaultValue: 'list' },
};

export const Showcase: Story = {
  render: () => {
    const [single, setSingle] = useState<string>('list');
    const [multi, setMulti] = useState<string[]>(['bold']);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleGroup
          type="single"
          items={VIEW_ITEMS}
          value={single}
          onChange={(v) => setSingle(v as string)}
        />
        <ToggleGroup
          type="single"
          tone="neutral"
          size="sm"
          items={VIEW_ITEMS}
          defaultValue="grid"
        />
        <ToggleGroup
          type="multiple"
          size="lg"
          items={[
            { value: 'bold', label: 'B' },
            { value: 'italic', label: 'I' },
            { value: 'underline', label: 'U' },
          ]}
          value={multi}
          onChange={(v) => setMulti(v as string[])}
        />
      </div>
    );
  },
};
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ToggleGroup
git commit -m "feat(ToggleGroup): single/multi segmented control with roving focus (#12)"
```

---

## Task 4: Drawer

**Files:**

- Create: `src/components/Drawer/Drawer.tsx`
- Create: `src/components/Drawer/Drawer.module.css`
- Create: `src/components/Drawer/Drawer.test.tsx`
- Create: `src/components/Drawer/Drawer.stories.tsx`
- Create: `src/components/Drawer/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/Drawer/Drawer.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';

// jsdom does not implement <dialog> showModal/close — shim them (mirrors Dialog.test).
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});

describe('Drawer', () => {
  it('is not shown when open is false', () => {
    render(
      <Drawer open={false} onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows and labels itself by its title when open', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('reflects the side as a data attribute', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters" side="start">
        Body
      </Drawer>,
    );
    expect(document.querySelector('dialog')).toHaveAttribute('data-side', 'start');
  });

  it('defaults the side to end', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(document.querySelector('dialog')).toHaveAttribute('data-side', 'end');
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange} title="Filters">
        Body
      </Drawer>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Drawer/Drawer.test.tsx`
Expected: FAIL — cannot resolve `./Drawer`.

- [ ] **Step 3: Write the component**

Create `src/components/Drawer/Drawer.tsx`:

```tsx
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import { mergeRefs, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { CloseIcon } from '../../icons';
import styles from './Drawer.module.css';

export type DrawerSide = 'start' | 'end' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  /** Whether the drawer is shown modally. */
  open: boolean;
  /** Called with the requested next open state (the drawer only requests `false`). */
  onOpenChange: (open: boolean) => void;
  /** Heading rendered in the header and used as the accessible name. */
  title?: ReactNode;
  /**
   * Edge the panel is pinned to. Logical, so 'start'/'end' flip in `dir="rtl"`.
   * Defaults to 'end'.
   */
  side?: DrawerSide;
  /** Panel width (inline sides) or height (block sides). Defaults to 'md'. */
  size?: DrawerSize;
  /** Allow Esc and backdrop click to close. Default true. */
  dismissable?: boolean;
  /** Where to send focus when the drawer opens, overriding the native default. */
  initialFocus?: RefObject<HTMLElement | null> | string;
  /** Actions rendered in the footer. */
  footer?: ReactNode;
  children?: ReactNode;
}

export const Drawer = /* @__PURE__ */ forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(
  {
    open,
    onOpenChange,
    title,
    side = 'end',
    size = 'md',
    dismissable = true,
    initialFocus,
    footer,
    children,
    className,
    ...props
  },
  forwardedRef,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId('drawer-title');
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Sync React `open` to native showModal()/close(), guarding both directions.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      if (initialFocus) {
        const target =
          typeof initialFocus === 'string'
            ? dialog.querySelector<HTMLElement>(initialFocus)
            : initialFocus.current;
        target?.focus();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // Keyed on `open`; `initialFocus` is read via closure (no exhaustive-deps rule).
  }, [open]);

  // Native close/cancel (Esc) → onOpenChange.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => close();
    const handleCancel = (event: Event) => {
      if (!dismissable) {
        event.preventDefault();
        return;
      }
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [close, dismissable]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (dismissable && event.target === dialogRef.current) {
        close();
      }
    },
    [dismissable, close],
  );

  return (
    <dialog
      ref={mergeRefs(dialogRef, forwardedRef)}
      className={cx(styles.root, className)}
      data-side={side}
      data-size={size}
      aria-labelledby={title ? titleId : undefined}
      onClick={handleBackdropClick}
      {...props}
    >
      <div className={styles.surface}>
        {(title || dismissable) && (
          <div className={styles.header}>
            {title ? (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            {dismissable ? (
              <button type="button" className={styles.close} aria-label="Close" onClick={close}>
                <CloseIcon aria-hidden />
              </button>
            ) : null}
          </div>
        )}
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </dialog>
  );
});
```

Create `src/components/Drawer/Drawer.module.css`:

```css
.root {
  margin: 0;
  padding: 0;
  border: none;
  max-width: none;
  max-height: none;
  background-color: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
  box-shadow: var(--ku-shadow-3);
  overflow: hidden;
  font-family: var(--ku-font-family-base);
}

/* Inline-edge drawers: full block size, pinned to one inline edge. */
.root[data-side='start'],
.root[data-side='end'] {
  block-size: 100dvh;
  inset-block: 0;
}
.root[data-side='start'] {
  inset-inline-start: 0;
  inset-inline-end: auto;
}
.root[data-side='end'] {
  inset-inline-end: 0;
  inset-inline-start: auto;
}
.root[data-side='start'][data-size='sm'],
.root[data-side='end'][data-size='sm'] {
  inline-size: 320px;
}
.root[data-side='start'][data-size='md'],
.root[data-side='end'][data-size='md'] {
  inline-size: 420px;
}
.root[data-side='start'][data-size='lg'],
.root[data-side='end'][data-size='lg'] {
  inline-size: 560px;
}

/* Block-edge drawers: full inline size, pinned to top/bottom. */
.root[data-side='top'],
.root[data-side='bottom'] {
  inline-size: 100dvw;
  inset-inline: 0;
}
.root[data-side='top'] {
  inset-block-start: 0;
  inset-block-end: auto;
}
.root[data-side='bottom'] {
  inset-block-end: 0;
  inset-block-start: auto;
}
.root[data-side='top'][data-size='sm'],
.root[data-side='bottom'][data-size='sm'] {
  block-size: 200px;
}
.root[data-side='top'][data-size='md'],
.root[data-side='bottom'][data-size='md'] {
  block-size: 320px;
}
.root[data-side='top'][data-size='lg'],
.root[data-side='bottom'][data-size='lg'] {
  block-size: 60vh;
}

.root::backdrop {
  background: rgb(0 0 0 / 0.5);
}

/* Slide-in, gated on reduced-motion. translateX is physical; in RTL the panel
   sits on the opposite inline edge (via inset-inline), so swap the start/end
   keyframes with :dir() to keep the slide coming from the visible edge. */
@media (prefers-reduced-motion: no-preference) {
  .root[open][data-side='start'] {
    animation: drawer-in-start var(--ku-duration-base) var(--ku-easing-standard);
  }
  .root[open][data-side='end'] {
    animation: drawer-in-end var(--ku-duration-base) var(--ku-easing-standard);
  }
  .root[open][data-side='start']:dir(rtl) {
    animation-name: drawer-in-end;
  }
  .root[open][data-side='end']:dir(rtl) {
    animation-name: drawer-in-start;
  }
  .root[open][data-side='top'] {
    animation: drawer-in-top var(--ku-duration-base) var(--ku-easing-standard);
  }
  .root[open][data-side='bottom'] {
    animation: drawer-in-bottom var(--ku-duration-base) var(--ku-easing-standard);
  }
  .root[open]::backdrop {
    animation: backdrop-in var(--ku-duration-base) var(--ku-easing-standard);
  }
}

@keyframes drawer-in-start {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes drawer-in-end {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes drawer-in-top {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes drawer-in-bottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.surface {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  max-block-size: 100%;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ku-space-4);
  padding: var(--ku-space-5) var(--ku-space-6);
  border-block-end: 1px solid var(--ku-color-border);
}

.title {
  margin: 0;
  font-size: var(--ku-font-size-lg);
  font-weight: var(--ku-font-weight-semibold);
  line-height: var(--ku-line-height-tight);
  color: var(--ku-color-text-primary);
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  margin: calc(var(--ku-space-1) * -1);
  padding: 0;
  border: none;
  border-radius: var(--ku-radius-md);
  background: transparent;
  color: var(--ku-color-text-secondary);
  cursor: pointer;
  transition: background-color var(--ku-duration-fast) var(--ku-easing-standard);
}
.close:hover {
  background-color: color-mix(in srgb, var(--ku-color-text-primary) 12%, transparent);
}

.body {
  flex: 1 1 auto;
  padding: var(--ku-space-6);
  overflow-y: auto;
  color: var(--ku-color-text-primary);
  line-height: var(--ku-line-height-base);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ku-space-3);
  padding: var(--ku-space-5) var(--ku-space-6);
  border-block-start: 1px solid var(--ku-color-border);
}
```

Create `src/components/Drawer/index.ts`:

```ts
export { Drawer } from './Drawer';
export type { DrawerProps, DrawerSide, DrawerSize } from './Drawer';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Drawer/Drawer.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the Showcase story**

Create `src/components/Drawer/Drawer.stories.tsx`. The Showcase renders an **open** drawer so the e2e axe harness inspects the live panel (Dialog uses the same approach):

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from '../Button';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
} satisfies Meta<typeof Drawer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Drawer
          open={open}
          onOpenChange={setOpen}
          title="Filters"
          footer={<Button onClick={() => setOpen(false)}>Apply</Button>}
        >
          Drawer body content.
        </Drawer>
      </>
    );
  },
};

export const Showcase: Story = {
  render: () => (
    <Drawer open onOpenChange={() => {}} title="Filters" side="end" footer={<Button>Apply</Button>}>
      Drawer body content for visual + a11y review.
    </Drawer>
  ),
};
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Drawer
git commit -m "feat(Drawer): edge slide-in panel on native <dialog> (#12)"
```

---

## Task 5: Integration — exports, e2e wiring, and gate

**Files:**

- Modify: `src/index.ts` (append exports)
- Modify: `e2e/components.spec.ts:60-70` (add COMPONENTS entries)

- [ ] **Step 1: Wire the public exports**

In `src/index.ts`, append after the final existing component export block (after the `DescriptionList`/`Combobox` exports, end of file):

```ts
// issue #12 — AvatarGroup, Stat, ToggleGroup, Drawer
export { AvatarGroup } from './components/AvatarGroup';
export type { AvatarGroupProps } from './components/AvatarGroup';
export { Stat } from './components/Stat';
export type { StatProps, StatTrend } from './components/Stat';
export { ToggleGroup } from './components/ToggleGroup';
export type {
  ToggleGroupProps,
  ToggleGroupItem,
  ToggleGroupSize,
  ToggleGroupTone,
} from './components/ToggleGroup';
export { Drawer } from './components/Drawer';
export type { DrawerProps, DrawerSide, DrawerSize } from './components/Drawer';
```

- [ ] **Step 2: Register e2e stories**

In `e2e/components.spec.ts`, inside the `COMPONENTS` array, add these entries just before the closing `] as const;` (after the `DescriptionList` entry at line 69):

```ts
  { name: 'AvatarGroup', storyId: 'components-avatargroup--showcase' },
  { name: 'Stat', storyId: 'components-stat--showcase' },
  { name: 'ToggleGroup', storyId: 'components-togglegroup--showcase' },
  { name: 'Drawer', storyId: 'components-drawer--showcase' },
```

- [ ] **Step 3: Full unit + type + lint gate**

Run: `npm test`
Expected: all suites pass (including the four new files).

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Build verification**

Run: `npm run build`
Expected: builds CJS + ESM + `.d.ts` with no errors; `dist/` includes the four new component chunks and the new types appear in the emitted `.d.ts`.

- [ ] **Step 5: Local a11y e2e (axe only)**

Run: `npm run test:e2e -- --grep "no axe violations"`
Expected: the new AvatarGroup/Stat/ToggleGroup/Drawer axe tests pass in both dark and light. (The `matches visual snapshot` tests will fail locally on Windows — see Step 6; that is expected and handled on the Linux runner.)

- [ ] **Step 6: Visual baselines (note — not generated locally)**

The `toHaveScreenshot` baselines for the four new stories must be generated on the hosted Linux runner via the **update-baselines workflow** (the local Windows render differs from the `ubuntu-24.04` CI runner, and `main` is branch-protected). Do **not** commit Windows-generated `*.png` baselines. After the PR is opened, trigger the update-baselines workflow against this branch so it produces `*-dark.png`/`*-light.png` (Linux) baselines for the new story IDs and commits them, then let CI go green.

- [ ] **Step 7: Commit integration**

```bash
git add src/index.ts e2e/components.spec.ts
git commit -m "chore: wire AvatarGroup/Stat/ToggleGroup/Drawer exports + e2e (#12)"
```

---

## Self-Review Notes (author checklist — completed)

- **Spec coverage:** AvatarGroup (Task 1), Stat (Task 2), ToggleGroup/SegmentedControl (Task 3), Drawer with logical sides (Task 4) — all four spec sections have a task. Exports + e2e + build gate (Task 5).
- **Stat ships without card chrome** (composes into `Card`), per the approved spec; the Showcase wraps it in `Card` to demonstrate.
- **Drawer uses logical `start`/`end`/`top`/`bottom`** with logical CSS inset + `:dir()` animation swap for RTL, matching spec and the #21 RTL audit.
- **ToggleGroup `onChange`** typed `(value: string | string[])`; stories narrow via `as string`/`as string[]` at call sites, matching the spec decision (no overloads).
- **Type consistency:** `ToggleGroupItem`, `StatTrend`, `DrawerSide`, `AvatarGroupProps` names are identical across component files, `index.ts`, and `src/index.ts` exports.
- **No invented tokens:** all `--ku-*` vars used are in the verified token list; `--ku-font-size-2xl` flagged with a fallback in Task 2 Step 6.

## After this plan

Remaining #12 gaps stay open for future work: DatePicker/Calendar, Sparkline/Chart + categorical palette, FileUpload, density modes, lazy/keepMounted for Tabs/Accordion, and DataTable column resize/reorder/row-expansion. Consider updating issue #12 to check off the now-shipped items and link a follow-up.
