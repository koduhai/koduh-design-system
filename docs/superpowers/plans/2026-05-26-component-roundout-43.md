# Component round-out (#43) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six new components — Popconfirm, Banner, ButtonGroup, SplitButton, Meter, NotificationBadge, ColorPicker — each following the established DS conventions, with full unit + a11y coverage.

**Architecture:** Each component is a self-contained folder under `src/components/<Name>/` (`Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`, `index.ts`) exported from `src/index.ts`. Composing components reuse existing primitives: Popconfirm + SplitButton's menu use `Popover`/`Menu`; SplitButton uses `ButtonGroup` + `Button`; Banner mirrors `Alert`'s severity model; ColorPicker reuses Slider's `setPointerCapture` drag pattern. No new shared infrastructure, so Tasks 1–7 are independent and built by parallel agents; Task 8 integrates.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules + `--ku-*` design tokens, Vitest + Testing Library, Playwright + axe.

**Conventions (apply to every task):** `forwardRef` + spread remaining DOM props to the root; `data-*` attributes for variants selected in CSS (`.root[data-tone='…']`); `cx(styles.root, className)`; `asChild` via `Slot` only where polymorphism helps; controlled/uncontrolled via `useControllableState`; logical CSS properties for RTL; never hardcode color — use `--ku-*`; export every public prop type from the folder `index.ts` and re-export from `src/index.ts`. Reference implementations: `src/components/Button/`, `src/components/Alert/`, `src/components/Slider/` (post-#56, has the pointer-drag pattern), `src/components/Menu/`, `src/components/Popover/`.

**Pre-req:** This branch (`feat/issue-43-component-roundout`) must be rebased onto `main` after PR #56 lands so the Slider pointer-drag pattern and `accent`/`info` tokens are present. Run `npm ci` once in any fresh worktree, then verify each task with `npm run typecheck` and `npx vitest run src/components/<Name>`.

---

## Task 1: Banner

**Files:**

- Create: `src/components/Banner/Banner.tsx`, `Banner.module.css`, `Banner.test.tsx`, `Banner.stories.tsx`, `index.ts`
- Modify: `src/index.ts` (add exports)
- Reference: `src/components/Alert/Alert.tsx` (severity icons, role mapping, dismiss button)

**API:**

```ts
export type BannerSeverity = 'info' | 'success' | 'warning' | 'error';
export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  severity: BannerSeverity;
  title?: ReactNode;
  children: ReactNode; // message body
  icon?: ReactNode; // override; `null` hides the icon
  dismissable?: boolean; // default false
  onClose?: () => void; // called when the dismiss button is pressed
  action?: ReactNode; // trailing CTA slot (e.g. a Button/Link)
}
```

- [ ] **Step 1: Write failing tests** in `Banner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders the message and reflects severity as a data attribute', () => {
    render(<Banner severity="warning">Heads up</Banner>);
    const el = screen.getByText('Heads up').closest('[data-severity]')!;
    expect(el).toHaveAttribute('data-severity', 'warning');
  });
  it('uses role="alert" for error/warning and role="status" otherwise', () => {
    const { rerender } = render(<Banner severity="error">x</Banner>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Banner severity="info">x</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('renders a dismiss button only when dismissable and fires onClose', async () => {
    const onClose = vi.fn();
    render(
      <Banner severity="info" dismissable onClose={onClose}>
        x
      </Banner>,
    );
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('renders a title and an action slot', () => {
    render(
      <Banner severity="info" title="T" action={<a href="#a">Act</a>}>
        x
      </Banner>,
    );
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Act' })).toBeInTheDocument();
  });
  it('hides the icon when icon={null}', () => {
    const { container } = render(
      <Banner severity="info" icon={null}>
        x
      </Banner>,
    );
    expect(container.querySelector('[data-banner-icon]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail** — `npx vitest run src/components/Banner` → fail (no module).
- [ ] **Step 3: Implement `Banner.tsx`** — `forwardRef<HTMLDivElement>`. Copy Alert's `defaultIcons: Record<BannerSeverity, ReactNode>` and `roleForSeverity` (`error`/`warning` → `'alert'`, `info`/`success` → `'status'`). Layout: leading icon (`<span data-banner-icon aria-hidden>` unless `icon===null`), a body column (`title` in a heading-weight span + `children`), the `action` slot, and the dismiss icon button (`aria-label="Dismiss"`, only when `dismissable`). Root: `<div ref className={cx(styles.root, className)} data-severity={severity} role={roleForSeverity[severity]} {...props}>`. `icon === undefined ? defaultIcons[severity] : icon`.
- [ ] **Step 4: Implement `Banner.module.css`** — `.root` full-width flex row, `gap`, `padding` from `--ku-space-*`, `border-radius: 0` (full-bleed feel) or small radius, `border-inline-start: 3px solid` the severity color, tinted background via `color-mix(in srgb, var(--ku-color-<sev>) 12%, var(--ku-color-bg-surface))`. Map `data-severity` → a local `--banner-accent` var (`info`→`--ku-color-info`, `success`→`--ku-color-success`, `warning`→`--ku-color-warning`, `error`→`--ku-color-danger`). Text uses `--ku-color-text-primary`; never rely on color alone (icon + text present). `.dismiss` is a transparent icon button.
- [ ] **Step 5: Run tests, verify pass** — `npx vitest run src/components/Banner`.
- [ ] **Step 6: Stories** in `Banner.stories.tsx` — a `Showcase` story rendering all four severities, one with `title` + `action`, one `dismissable`. Default export `{ title: 'Components/Banner', component: Banner }`.
- [ ] **Step 7: Export** from `src/components/Banner/index.ts` (`export { Banner } from './Banner'; export type { BannerProps, BannerSeverity } from './Banner';`) and add the same two export lines to `src/index.ts` (alphabetical neighborhood near `Avatar`/`Box`).
- [ ] **Step 8: Verify + commit** — `npm run typecheck` clean; `npx vitest run src/components/Banner` green. Commit `feat(Banner): page-level notice with severity vocabulary (#43)`.

---

## Task 2: ButtonGroup

**Files:**

- Create: `src/components/ButtonGroup/ButtonGroup.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Button/Button.tsx`

**API:**

```ts
export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: ButtonGroupOrientation; // default 'horizontal'
  children: ReactNode; // expects Button elements
}
```

- [ ] **Step 1: Failing tests** in `ButtonGroup.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button';

describe('ButtonGroup', () => {
  it('renders a group role and its buttons', () => {
    render(
      <ButtonGroup aria-label="Text style">
        <Button>Bold</Button>
        <Button>Italic</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Text style' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });
  it('reflects vertical orientation', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="g">
        <Button>A</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical');
  });
  it('forwards className and ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ButtonGroup ref={ref} className="x" aria-label="g">
        <Button>A</Button>
      </ButtonGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(screen.getByRole('group')).toHaveClass('x');
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `ButtonGroup.tsx`** — `forwardRef<HTMLDivElement>`, root `<div role="group" className={cx(styles.root, className)} data-orientation={orientation} {...props}>{children}</div>`.
- [ ] **Step 4: Implement `ButtonGroup.module.css`** — `.root { display: inline-flex; }`; `[data-orientation='horizontal']` → `flex-direction: row`, `[data-orientation='vertical']` → `column`. Collapse inner radii/borders with **logical** properties so adjacent buttons join: for horizontal, `.root[data-orientation='horizontal'] > :not(:first-child) { border-start-start-radius: 0; border-end-start-radius: 0; margin-inline-start: -1px; }` and `> :not(:last-child) { border-start-end-radius: 0; border-end-end-radius: 0; }`; mirror with block-logical radii for vertical. Add `.root > :hover, .root > :focus-visible { z-index: 1; }` so the active button's border wins. (Targets direct children generically — does not reach into Button internals.)
- [ ] **Step 5: Run, verify pass.**
- [ ] **Step 6: Stories** — horizontal + vertical groups of `outline` Buttons.
- [ ] **Step 7: Export** type `ButtonGroupProps`, `ButtonGroupOrientation` + component, in folder index + `src/index.ts`.
- [ ] **Step 8: Verify + commit** `feat(ButtonGroup): segmented button cluster (#43)`.

---

## Task 3: SplitButton

**Files:**

- Create: `src/components/SplitButton/SplitButton.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Menu/Menu.tsx` (`MenuEntry`, `items`, `trigger`), `src/components/ButtonGroup` (Task 2), `src/components/Button`. Depends on Task 2 being merged first (or built in the same integration).

**API:**

```ts
import type { MenuEntry } from '../Menu';
import type { ButtonTone, ButtonVariant, ButtonSize } from '../Button';
import type { PopoverPlacement } from '../Popover';
export interface SplitButtonProps {
  children: ReactNode; // primary action label
  onClick?: () => void; // primary action
  items: MenuEntry[]; // secondary actions for the caret menu
  tone?: ButtonTone; // default 'primary'
  variant?: ButtonVariant; // default 'solid'
  size?: ButtonSize; // default 'md'
  disabled?: boolean;
  startIcon?: ReactNode; // primary leading icon
  menuPlacement?: PopoverPlacement; // default 'bottom-end'
  menuLabel?: string; // caret aria-label, default 'More actions'
  className?: string;
}
```

- [ ] **Step 1: Failing tests** in `SplitButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  it('fires the primary onClick', async () => {
    const onClick = vi.fn();
    render(
      <SplitButton onClick={onClick} items={[{ label: 'B', onSelect: () => {} }]}>
        Save
      </SplitButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('opens the menu from the caret and selects an item', async () => {
    const onSelect = vi.fn();
    render(
      <SplitButton onClick={() => {}} items={[{ label: 'Save as…', onSelect }]}>
        Save
      </SplitButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Save as…' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
  it('disables both buttons when disabled', () => {
    render(
      <SplitButton disabled onClick={() => {}} items={[]}>
        Save
      </SplitButton>,
    );
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `SplitButton.tsx`** — render a `ButtonGroup`: first child is `<Button tone variant size disabled startIcon onClick>{children}</Button>`; second is a `Menu` whose `trigger` is a caret `<Button tone variant size disabled aria-label={menuLabel}><ChevronDownIcon/></Button>` and whose `items={items}` and `placement={menuPlacement}`. Import the caret icon from `../../icons`.
- [ ] **Step 4: Implement `SplitButton.module.css`** — minimal; mostly defers to ButtonGroup. Optionally `.caret { padding-inline: var(--ku-space-2); }` to tighten the caret button.
- [ ] **Step 5: Run, verify pass.**
- [ ] **Step 6: Stories** — a `Save` split button with `Save as…`, `Save a copy` items; one `disabled`.
- [ ] **Step 7: Export** `SplitButton` + `SplitButtonProps`.
- [ ] **Step 8: Verify + commit** `feat(SplitButton): primary action + attached menu (#43)`.

---

## Task 4: Meter

**Files:**

- Create: `src/components/Meter/Meter.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Progress/Progress.tsx` (track/fill + tone bridge)

**API:**

```ts
export type MeterSize = 'sm' | 'md';
export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  value: number;
  min?: number; // default 0
  max?: number; // default 100
  low?: number;
  high?: number;
  optimum?: number;
  label?: ReactNode; // rendered + used as aria-labelledby target
  formatValue?: (value: number) => string;
  size?: MeterSize; // default 'md'
  showValue?: boolean; // default false — show formatted value text
}
```

- [ ] **Step 1: Failing tests** in `Meter.test.tsx` — include the WHATWG tone cases:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Meter } from './Meter';

describe('Meter', () => {
  it('exposes role=meter with aria value attributes', () => {
    render(<Meter label="Disk" value={30} min={0} max={100} />);
    const m = screen.getByRole('meter', { name: 'Disk' });
    expect(m).toHaveAttribute('aria-valuenow', '30');
    expect(m).toHaveAttribute('aria-valuemin', '0');
    expect(m).toHaveAttribute('aria-valuemax', '100');
  });
  it('uses aria-valuetext from formatValue and shows it when showValue', () => {
    render(<Meter label="D" value={42} formatValue={(v) => `${v}%`} showValue />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '42%');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
  // optimum below low => lower is better. value in low band = good, high band = poor.
  it('derives tone good/caution/poor from thresholds (lower-is-better)', () => {
    const { rerender } = render(
      <Meter label="D" value={10} max={100} low={30} high={70} optimum={10} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'good');
    rerender(<Meter label="D" value={50} max={100} low={30} high={70} optimum={10} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'caution');
    rerender(<Meter label="D" value={90} max={100} low={30} high={70} optimum={10} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'poor');
  });
  it('is neutral when no thresholds are given', () => {
    render(<Meter label="D" value={50} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'neutral');
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement tone helper + component.** In `Meter.tsx` add:

```ts
// WHATWG <meter> coloring. Returns the qualitative band for `value`.
function meterTone(
  value: number,
  min: number,
  max: number,
  low?: number,
  high?: number,
  optimum?: number,
): 'good' | 'caution' | 'poor' | 'neutral' {
  if (low === undefined && high === undefined && optimum === undefined) return 'neutral';
  const lo = low ?? min;
  const hi = high ?? max;
  if (optimum === undefined) {
    // no optimum: in [lo,hi] is good, outside is caution
    return value >= lo && value <= hi ? 'good' : 'caution';
  }
  // Determine preferred region of optimum, then grade value by distance band.
  if (optimum < lo) {
    // lower is better
    if (value <= lo) return 'good';
    if (value <= hi) return 'caution';
    return 'poor';
  }
  if (optimum > hi) {
    // higher is better
    if (value >= hi) return 'good';
    if (value >= lo) return 'caution';
    return 'poor';
  }
  // middle is best
  if (value >= lo && value <= hi) return 'good';
  return 'caution';
}
```

Component: `forwardRef<HTMLDivElement>`, generate an id, render `label` in a `<span id={labelId}>` (when provided), and the meter `<div role="meter" aria-labelledby={labelId} aria-label={!label ? props['aria-label'] : undefined} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-valuetext={formatValue?.(value)} data-tone={tone} data-size={size} style={{ '--meter-pct': pct }}>` with an inner `.fill`. `pct = ((value-min)/(max-min))*100` clamped 0–100. Show `formatValue?.(value)` text when `showValue`.

- [ ] **Step 4: Implement `Meter.module.css`** — like Progress: `.track` rounded bg `--ku-color-bg-surface`, `.fill` width `var(--meter-pct)`. Map `data-tone`: `good`→`--ku-color-success`, `caution`→`--ku-color-warning`, `poor`→`--ku-color-danger`, `neutral`→`--ku-color-primary` into `--meter-fill`. `data-size='sm'` thinner.
- [ ] **Step 5: Run, verify pass.**
- [ ] **Step 6: Stories** — disk-usage style examples across good/caution/poor and a no-threshold neutral one, plus `showValue`.
- [ ] **Step 7: Export** `Meter`, `MeterProps`, `MeterSize`.
- [ ] **Step 8: Verify + commit** `feat(Meter): role=meter measurement gauge with threshold tones (#43)`.

---

## Task 5: NotificationBadge

**Files:**

- Create: `src/components/NotificationBadge/NotificationBadge.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Chip` (tone bridge), `src/primitives/VisuallyHidden`

**API:**

```ts
import type { ChipTone } from '../Chip'; // reuse the shared tone vocab incl. info/accent
export type NotificationBadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';
export interface NotificationBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode; // the anchored element (icon/avatar/button); omit for standalone badge
  count?: number; // numeric badge
  max?: number; // default 99 → renders "99+"
  dot?: boolean; // show a dot instead of a count
  showZero?: boolean; // default false — hide when count===0
  tone?: ChipTone; // default 'danger'
  placement?: NotificationBadgePlacement; // default 'top-end'
  label?: string; // accessible text, e.g. "3 unread notifications"
}
```

- [ ] **Step 1: Failing tests** in `NotificationBadge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationBadge } from './NotificationBadge';

describe('NotificationBadge', () => {
  it('renders the count over its child', () => {
    render(
      <NotificationBadge count={3}>
        <button>Inbox</button>
      </NotificationBadge>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument();
  });
  it('clamps to max with a plus suffix', () => {
    render(
      <NotificationBadge count={150} max={99}>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
  it('hides when count is 0 unless showZero', () => {
    const { rerender, container } = render(
      <NotificationBadge count={0}>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(container.querySelector('[data-badge]')).toBeNull();
    rerender(
      <NotificationBadge count={0} showZero>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('renders a dot with no number when dot is set', () => {
    const { container } = render(
      <NotificationBadge dot label="New">
        <span>x</span>
      </NotificationBadge>,
    );
    const badge = container.querySelector('[data-badge]')!;
    expect(badge).toHaveAttribute('data-dot', 'true');
    expect(screen.getByText('New')).toBeInTheDocument(); // visually-hidden label
  });
  it('reflects tone and placement', () => {
    const { container } = render(
      <NotificationBadge count={1} tone="primary" placement="bottom-start">
        <span>x</span>
      </NotificationBadge>,
    );
    const badge = container.querySelector('[data-badge]')!;
    expect(badge).toHaveAttribute('data-tone', 'primary');
    expect(badge).toHaveAttribute('data-placement', 'bottom-start');
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `NotificationBadge.tsx`** — `forwardRef<HTMLSpanElement>`. Compute `hidden = !dot && (count === undefined || (count === 0 && !showZero))`. Display text: `dot ? '' : count! > max ? \`${max}+\` : String(count)`. Root `<span className={cx(styles.root, className)} {...props}>`; render `children`, then (unless hidden) `<span data-badge data-tone={tone} data-dot={dot || undefined} data-placement={placement} className={styles.badge}>`. Inside the badge: the visible number (`aria-hidden`when a`label`is supplied) and, when`label`, a `<VisuallyHidden>{label}</VisuallyHidden>`for the accessible announcement. When`dot`, render only the `VisuallyHidden`label (no number). When standalone (no`children`), the badge renders inline (position static) — guard with `data-standalone`.
- [ ] **Step 4: Implement `NotificationBadge.module.css`** — `.root { position: relative; display: inline-flex; }`. `.badge { position: absolute; min-width/height ~18px; border-radius: var(--ku-radius-full); font-size: var(--ku-font-size-xs); display: inline-flex; align-items/justify: center; padding-inline: 4px; }`. Tone bridge (mirror Chip): `data-tone` → `background: var(--ku-color-<tone>); color: var(--ku-color-bg-default)` (primary uses `--ku-color-primary-contrast`; neutral uses raised+text-primary). `data-dot='true'` → fixed 8px circle, no padding. `data-placement` → inset-block/inset-inline via **logical** offsets (`top-end`: `inset-block-start: 0; inset-inline-end: 0; transform: translate(50%, -50%)` — flips under RTL automatically). `[data-standalone] .badge { position: static; transform: none; }`.
- [ ] **Step 5: Run, verify pass.**
- [ ] **Step 6: Stories** — badge over an icon button (count 3), over an Avatar (99+), a dot variant, and a standalone badge; show a couple of tones.
- [ ] **Step 7: Export** `NotificationBadge`, `NotificationBadgeProps`, `NotificationBadgePlacement`.
- [ ] **Step 8: Verify + commit** `feat(NotificationBadge): count/dot overlay (#43)`.

---

## Task 6: Popconfirm

**Files:**

- Create: `src/components/Popconfirm/Popconfirm.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Popover/Popover.tsx`, `src/components/ConfirmDialog` (confirm semantics), `src/components/Button`

**API:**

```ts
import type { PopoverPlacement } from '../Popover';
import type { ButtonTone } from '../Button';
export interface PopconfirmProps {
  trigger: ReactElement;
  title?: ReactNode;
  children: ReactNode; // message
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string; // default 'Confirm'
  cancelLabel?: string; // default 'Cancel'
  confirmTone?: ButtonTone; // default 'primary'
  open?: boolean; // controlled
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement; // default 'top'
}
```

- [ ] **Step 1: Failing tests** in `Popconfirm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Popconfirm } from './Popconfirm';

describe('Popconfirm', () => {
  it('opens from the trigger, confirms, and closes', async () => {
    const onConfirm = vi.fn();
    render(
      <Popconfirm trigger={<button>Delete</button>} onConfirm={onConfirm}>
        Are you sure?
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('cancel fires onCancel and closes without confirming', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Popconfirm trigger={<button>Del</button>} onConfirm={onConfirm} onCancel={onCancel}>
        Sure?
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Del' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `Popconfirm.tsx`** — use `useControllableState` for open (`value: open`, `onChange: onOpenChange`, default false). Render `<Popover trigger={trigger} open={isOpen} onOpenChange={setOpen} placement={placement}>` whose children are: optional `title`, the message `children` (give it an id, pass `aria-describedby` via the Popover content if supported, else just render), and a button row: `<Button variant="ghost" tone="neutral" size="sm" onClick={cancel}>{cancelLabel}</Button>` + `<Button variant="solid" tone={confirmTone} size="sm" onClick={confirmAndClose}>{confirmLabel}</Button>`. `confirmAndClose = () => { onConfirm(); setOpen(false); }` (onConfirm before close, matching ConfirmDialog). `cancel = () => { onCancel?.(); setOpen(false); }`. Popover already handles Esc/outside-click → those call `onOpenChange(false)`; route that through `onCancel` only when it's an explicit dismiss is optional — keep it simple: outside/Esc just closes.
- [ ] **Step 4: Implement `Popconfirm.module.css`** — `.panel { display: flex; flex-direction: column; gap: var(--ku-space-3); max-width: 280px; }`, `.actions { display: flex; gap: var(--ku-space-2); justify-content: flex-end; }`, `.title { font-weight: var(--ku-font-weight-semibold); }`.
- [ ] **Step 5: Run, verify pass.**
- [ ] **Step 6: Stories** — a destructive delete confirm (`confirmTone="danger"`) and a default one.
- [ ] **Step 7: Export** `Popconfirm`, `PopconfirmProps`.
- [ ] **Step 8: Verify + commit** `feat(Popconfirm): inline confirmation popover (#43)`.

---

## Task 7: ColorPicker

**Files:**

- Create: `src/components/ColorPicker/ColorPicker.tsx`, `color.ts`, `color.test.ts`, `ColorPicker.module.css`, `ColorPicker.test.tsx`, `ColorPicker.stories.tsx`, `index.ts`
- Modify: `src/index.ts`
- Reference: `src/components/Slider/Slider.tsx` (pointer-drag + `setPointerCapture`), `src/components/TextField` + `useOptionalFieldContext`

**API:**

```ts
export interface ColorPickerProps {
  value?: string; // hex in (#RGB/#RRGGBB/#RRGGBBAA)
  defaultValue?: string; // default '#1B5FCC'
  onChange?: (hex: string) => void;
  alpha?: boolean; // default false
  swatches?: string[]; // preset row; sensible DS default if omitted
  disabled?: boolean;
  label?: ReactNode; // FormField-aware
  id?: string;
  className?: string;
}
```

- [ ] **Step 1: Color-math failing tests** in `color.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseHex, toHex, hsvToRgb, rgbToHsv } from './color';

describe('color helpers', () => {
  it('parses 3/6/8-digit hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseHex('#1B5FCC')).toEqual({ r: 27, g: 95, b: 204, a: 1 });
    expect(parseHex('#1B5FCC80')!.a).toBeCloseTo(0.5, 1);
  });
  it('returns null for invalid hex', () => {
    expect(parseHex('nope')).toBeNull();
  });
  it('serializes to #RRGGBB and #RRGGBBAA', () => {
    expect(toHex({ r: 27, g: 95, b: 204, a: 1 })).toBe('#1B5FCC');
    expect(toHex({ r: 27, g: 95, b: 204, a: 0.5 })).toBe('#1B5FCC80');
  });
  it('round-trips rgb<->hsv', () => {
    const rgb = { r: 27, g: 95, b: 204 };
    const hsv = rgbToHsv(rgb);
    const back = hsvToRgb(hsv);
    expect(back.r).toBeCloseTo(27, 0);
    expect(back.g).toBeCloseTo(95, 0);
    expect(back.b).toBeCloseTo(204, 0);
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `color.ts`** — pure functions, no React. Types `RGB = { r:number; g:number; b:number; a?:number }`, `HSV = { h:number; s:number; v:number; a:number }`.
  - `parseHex(s): { r,g,b,a } | null` — accept `#RGB`, `#RRGGBB`, `#RRGGBBAA` (case-insensitive, optional leading `#`); expand shorthand; `a` defaults 1; return null on anything else.
  - `toHex({r,g,b,a}): string` — uppercase `#RRGGBB`, appending `AA` only when `a` is defined and `< 1` (round `a*255`). Clamp/round channels.
  - `rgbToHsv({r,g,b})` and `hsvToRgb({h,s,v})` — standard conversions; `h` in [0,360), `s`/`v` in [0,1]; carry alpha through unchanged in the component layer.
- [ ] **Step 4: Run color tests, verify pass.**
- [ ] **Step 5: Component failing tests** in `ColorPicker.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('shows the current hex and emits onChange from the hex input', async () => {
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" value="#1B5FCC" onChange={onChange} />);
    const input = screen.getByLabelText(/hex/i) as HTMLInputElement;
    expect(input.value.toUpperCase()).toContain('1B5FCC');
    await userEvent.clear(input);
    await userEvent.type(input, '#FF0000');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('#FF0000');
  });
  it('selecting a swatch emits its hex', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1B5FCC" onChange={onChange} swatches={['#FF0000', '#00FF00']} />);
    await userEvent.click(screen.getByRole('button', { name: /#FF0000/i }));
    expect(onChange).toHaveBeenCalledWith('#FF0000');
  });
  it('exposes hue as a slider', () => {
    render(<ColorPicker value="#1B5FCC" />);
    expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
  });
  it('renders an alpha slider only when alpha is set', () => {
    const { rerender } = render(<ColorPicker value="#1B5FCC" />);
    expect(screen.queryByRole('slider', { name: /alpha/i })).toBeNull();
    rerender(<ColorPicker value="#1B5FCC" alpha />);
    expect(screen.getByRole('slider', { name: /alpha/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run, verify fail.**
- [ ] **Step 7: Implement `ColorPicker.tsx`** — `useOptionalFieldContext` for label/id deferral (like TextField). Internal HSV(A) state via `useControllableState` on the hex string, deriving HSV from the bound/controlled hex with a buffer so dragging is smooth (mirror NumberField's external-sync ref pattern). Emit by serializing HSV→RGB→`toHex` (include alpha only when `alpha` && a<1). Surfaces:
  - **SV square:** a `<div role="slider" aria-label="Saturation and brightness" tabIndex={0}>` with a handle; pointer-drag using the **same** `onPointerDown`/`onPointerMove`/`endDrag` + `setPointerCapture` pattern as Slider (guarded try/catch for jsdom; mock `getBoundingClientRect` in tests if exercising drag). Map x→s (0..1), y→v (1..0). Arrow keys nudge s/v. `aria-valuetext` = current hex.
  - **Hue slider:** `role="slider"` `aria-label="Hue"` 0..360, arrow keys, pointer-drag.
  - **Alpha slider (when `alpha`):** `role="slider"` `aria-label="Alpha"` 0..1 over a checkerboard.
  - **Hex input:** a labelled `<input>` (`aria-label="Hex"` or via FormField label); normalize/validate on blur/Enter with `parseHex`; revert to current on invalid.
  - **Swatches:** `swatches.map` → `<button type="button" aria-label={hex} style background hex>`; click sets value; mark the selected one (`aria-pressed`).
  - **Preview:** a swatch showing current color + a visible/`VisuallyHidden` hex readout (color not the only signal).
  - Default `swatches` = a small DS palette, e.g. `['#1B5FCC','#1B7F3B','#9A6700','#C62828','#7C3AED','#0E7490','#10141F','#FFFFFF']`.
- [ ] **Step 8: Implement `ColorPicker.module.css`** — grid/flex layout; SV square `aspect-ratio: 1; background: linear-gradient overlays using the current hue var --cp-hue`; hue slider rainbow gradient; alpha slider checkerboard + gradient; handles are small circles with focus-visible ring; swatch row wraps. Use tokens for spacing/radius/border.
- [ ] **Step 9: Run component tests, verify pass.**
- [ ] **Step 10: Stories** — default picker, with `alpha`, with custom `swatches`, inside a `FormField` (label association), and one inside a `Popover` trigger (demonstrating the documented compose-it-yourself pattern).
- [ ] **Step 11: Export** `ColorPicker`, `ColorPickerProps` (folder index + `src/index.ts`).
- [ ] **Step 12: Verify + commit** `feat(ColorPicker): SV/hue/alpha/hex/swatch picker (#43)`.

---

## Task 8: Integration & full gate

**Files:** `src/index.ts` (resolve export ordering), any conflicts.

- [ ] **Step 1:** Merge the six component branches into the integration branch (`feat/issue-43-component-roundout`). Resolve `src/index.ts` (additions in different regions — should auto-merge; verify alphabetical grouping is sane).
- [ ] **Step 2:** Remove parallel worktrees (`git worktree remove … --force`) so locks don't block lint (Windows).
- [ ] **Step 3:** `npm run build:tokens` (no token changes expected, but keep theme.css fresh), then `npm run typecheck` — clean.
- [ ] **Step 4:** `npm run lint` — clean.
- [ ] **Step 5:** `npm test` — all green (new component suites included).
- [ ] **Step 6:** `npm run build` — success; confirm new components appear in `dist/index.d.ts`.
- [ ] **Step 7:** Sanity-check stories render (optional `npm run storybook`); push branch and open a PR. e2e visual baselines for the new stories will fail first run — regenerate via `gh workflow run update-baselines.yml --ref feat/issue-43-component-roundout`, then close/reopen the PR to re-trigger CI.
- [ ] **Step 8:** Commit any integration fixups; PR body lists the six components and `Closes #43`.

---

## Notes for the implementer

- **Tone vocabulary:** post-#56 the shared tone set is `primary | neutral | success | warning | danger | info | accent`. NotificationBadge reuses `ChipTone`; SplitButton/Popconfirm reuse `ButtonTone`.
- **Severity vs tone:** Banner uses the _severity_ axis (`info|success|warning|error`) matching `Alert`, NOT the action tone axis. Don't conflate.
- **RTL:** every offset/radius that has a left/right must use logical properties (`inset-inline-*`, `border-*-start-*`). axe e2e runs both themes; manual RTL check via the `dir` knob if present.
- **Color is never the only signal:** Banner (icon+text), Meter (`aria-valuetext`/`showValue`), NotificationBadge (`label`), ColorPicker (hex readout).
- **No new tokens** are required; if ColorPicker needs a checkerboard it can use a CSS gradient, not a token.
