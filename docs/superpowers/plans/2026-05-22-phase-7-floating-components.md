# Phase 7 — Floating Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four floating-UI components — a generic `Popover` foundation plus `Tooltip`, `Select`, and `Menu` — built on the native Popover API (top-layer) and CSS Anchor Positioning, with zero new Layer-2 infrastructure.

**Architecture:** `Popover` is the shared foundation: it renders a consumer-supplied trigger (via `Slot`) wired to a top-layer floating panel using the Popover API for stacking and CSS Anchor Positioning for placement. `Tooltip`, `Select`, and `Menu` compose `Popover`. **Build order is foundation-first:** Task 1 (`Popover`) must land before Tasks 2–4, which are independent and can run as parallel subagents. Task 5 is the central integration done in the main session.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules, Vitest + Testing Library (jsdom), Playwright + axe-core, Storybook. No runtime dependencies.

---

## Conventions every task follows (read once)

These mirror `src/components/Button/` and the v1.1 components. Do not deviate.

- **Folder:** each component is `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`.
- **`forwardRef` + `/* @__PURE__ */`** wrapper, named inner function (`function Popover(...)`).
- **`cx(styles.root, className)`** merges the scoped module class with a consumer `className`, always forwarded to the root.
- **Variant/state styling via `data-*` attributes** selected on in the `.module.css` (e.g. `.panel[data-placement='bottom']`), never class composition.
- **DOM-prop collisions** (`open`, `value`, `onChange`, `placement`, `content`) **must be `Omit`-ted** from the extended `HTMLAttributes` and re-declared. This is a typecheck-only failure mode.
- **Controlled/uncontrolled** via `useControllableState` from `../../primitives`.
- **Every public prop type is exported** from the component `index.ts`.
- **Run only your own test file** (`npx vitest run src/components/<Name>/<Name>.test.tsx`). Do **not** run project-wide `typecheck`/`lint`/`build`, edit shared files (`src/index.ts`, `e2e/components.spec.ts`, `README.md`), or run git beyond your own component commits — the integration session (Task 5) owns those.

### The native-platform wiring (the one genuinely new thing)

Two browser features replace hand-built infra:

1. **Top layer via the Popover API.** A floating element gets `el.setAttribute('popover', 'manual')` then `el.showPopover()` / `el.hidePopover()`. Copy the **graceful-degradation guard** from `src/components/Snackbar/Snackbar.tsx:57-86`: only call these when `typeof el.showPopover === 'function'`, wrap in `try/catch`, and if the element does not actually reach `:popover-open` (e.g. jsdom's stub), remove the `popover` attribute so the node stays in the accessibility tree and `data-open` drives styling. **Unit tests run in jsdom, which has no real Popover API — so tests assert DOM/ARIA/callbacks, never pixel position.**
2. **Placement via CSS Anchor Positioning.** The trigger sets a CSS custom property `--ku-anchor-name` whose value is a unique dashed-ident (e.g. `--ku-anchor-r1`); the panel reads it for both `anchor-name` (trigger) and `position-anchor` (panel) in CSS. Placement maps to `position-area` per `data-placement`. `position-try-fallbacks: flip-block, flip-inline` provides automatic flip. Where unsupported, the panel renders at its static position — graceful degradation, validated in e2e, not unit tests.

Using a `--`-prefixed custom property (not the `anchorName`/`positionAnchor` style keys directly) keeps the inline style object valid `CSSProperties` with no `as unknown as` casts.

---

## File Structure

**Created:**

- `src/components/Popover/Popover.tsx` — generic anchored container (foundation)
- `src/components/Popover/Popover.module.css`
- `src/components/Popover/Popover.test.tsx`
- `src/components/Popover/Popover.stories.tsx`
- `src/components/Popover/index.ts`
- `src/components/Tooltip/{Tooltip.tsx,Tooltip.module.css,Tooltip.test.tsx,Tooltip.stories.tsx,index.ts}`
- `src/components/Select/{Select.tsx,Select.module.css,Select.test.tsx,Select.stories.tsx,index.ts}`
- `src/components/Menu/{Menu.tsx,Menu.module.css,Menu.test.tsx,Menu.stories.tsx,index.ts}`

**Modified (Task 5 / integration only):**

- `src/index.ts` — add the four exports + prop types
- `e2e/components.spec.ts:16-40` — add four entries to `COMPONENTS`
- `README.md` — component status block

---

## Task 1: Popover (foundation — build and prove first)

**Files:**

- Create: `src/components/Popover/Popover.tsx`
- Create: `src/components/Popover/Popover.module.css`
- Create: `src/components/Popover/Popover.test.tsx`
- Create: `src/components/Popover/Popover.stories.tsx`
- Create: `src/components/Popover/index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Popover/Popover.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Popover } from './Popover';

function Harness({
  defaultOpen = false,
  dismissable = true,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  dismissable?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button data-testid="outside">outside</button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        dismissable={dismissable}
        role="dialog"
        trigger={
          <button type="button" onClick={() => setOpen((o) => !o)}>
            Open
          </button>
        }
      >
        <p>Panel content</p>
      </Popover>
    </div>
  );
}

describe('Popover', () => {
  it('renders the trigger and wires a shared anchor name', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    const anchorName = trigger.style.getPropertyValue('--ku-anchor-name');
    expect(anchorName).toMatch(/^--ku-anchor-/);
  });

  it('shows panel content when open', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('toggles open from the trigger', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'false');
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true');
  });

  it('closes on Escape when dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on Escape when not dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen dismissable={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on outside pointerdown when dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Popover/Popover.test.tsx`
Expected: FAIL — `Failed to resolve import './Popover'`.

- [ ] **Step 3: Write the module CSS**

`src/components/Popover/Popover.module.css`:

```css
.anchor {
  anchor-name: var(--ku-anchor-name);
}

.panel {
  position: fixed;
  position-anchor: var(--ku-anchor-name);
  position-try-fallbacks: flip-block, flip-inline;
  margin: var(--ku-popover-offset, 0.5rem);
  z-index: 1; /* harmless; the Popover API top layer renders above regardless */
  box-sizing: border-box;
  background: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
  border: 1px solid var(--ku-color-border-default);
  border-radius: var(--ku-radius-md);
  box-shadow: var(--ku-shadow-md);
  padding: 0; /* consumers own inner padding */
}

/* When the Popover API is unavailable (jsdom) or hidden, data-open drives display. */
.panel[data-open='false'] {
  display: none;
}

.panel[data-placement='bottom'] {
  position-area: bottom;
}
.panel[data-placement='bottom-start'] {
  position-area: bottom span-right;
}
.panel[data-placement='bottom-end'] {
  position-area: bottom span-left;
}
.panel[data-placement='top'] {
  position-area: top;
}
.panel[data-placement='top-start'] {
  position-area: top span-right;
}
.panel[data-placement='top-end'] {
  position-area: top span-left;
}
.panel[data-placement='left'] {
  position-area: left;
}
.panel[data-placement='left-start'] {
  position-area: left span-bottom;
}
.panel[data-placement='left-end'] {
  position-area: left span-top;
}
.panel[data-placement='right'] {
  position-area: right;
}
.panel[data-placement='right-start'] {
  position-area: right span-bottom;
}
.panel[data-placement='right-end'] {
  position-area: right span-top;
}
```

> Note: confirm the exact token names (`--ku-color-bg-surface`, `--ku-shadow-md`, etc.) against `dist/theme.css` / `src/theme/tokens.ts`; substitute the nearest existing token if a name differs. Do **not** invent tokens — reuse existing ones.

- [ ] **Step 4: Write the implementation**

`src/components/Popover/Popover.tsx`:

```tsx
import { forwardRef, useEffect, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Slot, mergeRefs, useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Popover.module.css';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the requested next open state (trigger toggle, Esc, outside click). */
  onOpenChange?: (open: boolean) => void;
  /** The anchor element. Rendered via Slot so anchor wiring merges onto your element. */
  trigger: ReactElement;
  /** Anchored placement. Defaults to 'bottom'. */
  placement?: PopoverPlacement;
  /** Gap (px) between anchor and panel. Defaults to 8. */
  offset?: number;
  /** Allow Esc / outside-click to request close. Default true. */
  dismissable?: boolean;
  /** ARIA role for the floating panel; consumers set 'listbox' | 'menu' | 'tooltip' | 'dialog'. */
  role?: string;
  children: ReactNode;
}

export const Popover = /* @__PURE__ */ forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    open,
    defaultOpen = false,
    onOpenChange,
    trigger,
    placement = 'bottom',
    offset = 8,
    dismissable = true,
    role,
    className,
    children,
    ...props
  },
  forwardedRef,
) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorName = `--${useId('ku-anchor')}`;

  // Sync open → native Popover API top layer, degrading gracefully (see Snackbar).
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof el.showPopover !== 'function') return;
    el.setAttribute('popover', 'manual');
    try {
      if (isOpen) el.showPopover();
      else el.hidePopover();
    } catch {
      /* already in target state */
    }
    let opened = false;
    try {
      opened = el.matches(':popover-open');
    } catch {
      opened = false;
    }
    if (isOpen && !opened) el.removeAttribute('popover');
  }, [isOpen]);

  // Esc + outside-pointerdown dismissal (works in jsdom and all browsers).
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, dismissable, setOpen]);

  // `--`-prefixed keys are valid CSSProperties keys via React's custom-property
  // index signature — no cast needed (and `as string` would BREAK that match).
  const triggerStyle: CSSProperties = { ['--ku-anchor-name']: anchorName };
  const panelStyle: CSSProperties = {
    ['--ku-anchor-name']: anchorName,
    ['--ku-popover-offset']: `${offset}px`,
  };

  return (
    <>
      <Slot ref={triggerRef as Ref<HTMLElement>} className={styles.anchor} style={triggerStyle}>
        {trigger}
      </Slot>
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        role={role}
        data-placement={placement}
        data-open={isOpen ? 'true' : 'false'}
        style={panelStyle}
        className={cx(styles.panel, className)}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Popover/Popover.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the barrel export**

`src/components/Popover/index.ts`:

```ts
export { Popover } from './Popover';
export type { PopoverProps, PopoverPlacement } from './Popover';
```

- [ ] **Step 7: Write stories (open state for axe/visual)**

`src/components/Popover/Popover.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Popover } from './Popover';
import { Button } from '../Button';

const meta = {
  title: 'Components/Popover',
  component: Popover,
} satisfies Meta<typeof Popover>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: <Button>Open</Button>, children: null },
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 80 }}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          role="dialog"
          trigger={<Button onClick={() => setOpen((o) => !o)}>Toggle popover</Button>}
        >
          <div style={{ padding: 16, maxWidth: 240 }}>Anchored content.</div>
        </Popover>
      </div>
    );
  },
};

// Open by default so axe/visual capture the rendered panel.
export const Showcase: Story = {
  args: { trigger: <Button>Anchor</Button>, children: null },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 120 }}>
      <Popover open onOpenChange={() => {}} role="dialog" trigger={<Button>Anchor</Button>}>
        <div style={{ padding: 16, maxWidth: 260 }}>
          This popover is rendered open for accessibility and visual testing.
        </div>
      </Popover>
    </div>
  ),
};
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Popover
git commit -m "feat: add Popover foundation (Popover API + CSS anchor positioning)"
```

---

## Task 2: Tooltip (parallel — composes Popover)

**Files:**

- Create: `src/components/Tooltip/Tooltip.tsx`
- Create: `src/components/Tooltip/Tooltip.module.css`
- Create: `src/components/Tooltip/Tooltip.test.tsx`
- Create: `src/components/Tooltip/Tooltip.stories.tsx`
- Create: `src/components/Tooltip/index.ts`

- [ ] **Step 1: Write the failing test**

`src/components/Tooltip/Tooltip.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Tooltip', () => {
  it('links the trigger to the tooltip via aria-describedby on open', () => {
    render(
      <Tooltip content="More info" delay={0}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Help' });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('More info');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
  });

  it('opens on hover after the delay', () => {
    render(
      <Tooltip content="Hi" delay={200}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it('closes on blur', () => {
    render(
      <Tooltip content="Hi" delay={0}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
    act(() => fireEvent.blur(trigger));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Tooltip/Tooltip.test.tsx`
Expected: FAIL — cannot resolve `./Tooltip`.

- [ ] **Step 3: Write the module CSS**

`src/components/Tooltip/Tooltip.module.css`:

```css
.tooltip {
  padding: var(--ku-space-1) var(--ku-space-2);
  font-size: var(--ku-font-size-sm);
  line-height: var(--ku-line-height-tight);
  max-width: 16rem;
  pointer-events: none; /* non-interactive */
  transition: opacity 120ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
```

> Confirm token names against `dist/theme.css`; substitute nearest existing token if needed.

- [ ] **Step 4: Write the implementation**

`src/components/Tooltip/Tooltip.tsx`:

```tsx
import { cloneElement, forwardRef, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** Tooltip text/content. */
  content: ReactNode;
  /** Anchored placement. Defaults to 'top'. */
  placement?: PopoverPlacement;
  /** Open/close delay in ms. Defaults to 200. */
  delay?: number;
  /** Extra class on the tooltip panel. */
  className?: string;
  /** The single trigger element. */
  children: ReactElement;
}

export const Tooltip = /* @__PURE__ */ forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { content, placement = 'top', delay = 200, className, children },
  ref,
) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId('tooltip');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const scheduleOpen = () => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const close = () => {
    clear();
    setOpen(false);
  };

  // Attach describedby + open/close handlers to the consumer's trigger.
  const trigger = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: scheduleOpen,
    onMouseLeave: close,
    onFocus: () => setOpen(true),
    onBlur: close,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') close();
      (children.props as { onKeyDown?: (e: React.KeyboardEvent) => void }).onKeyDown?.(e);
    },
  } as Partial<typeof children.props>);

  return (
    <Popover
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      dismissable={false}
      placement={placement}
      role="tooltip"
      id={tooltipId}
      trigger={trigger}
      className={cx(styles.tooltip, className)}
    >
      {content}
    </Popover>
  );
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Tooltip/Tooltip.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the barrel export**

`src/components/Tooltip/index.ts`:

```ts
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';
```

- [ ] **Step 7: Write stories (open state)**

`src/components/Tooltip/Tooltip.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { content: 'Saves your work', children: <Button>Save</Button> },
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Tooltip {...args} />
    </div>
  ),
};

// delay=0 + autofocus open the tooltip for axe/visual capture.
export const Showcase: Story = {
  args: { content: 'Tooltip', children: <Button>Trigger</Button> },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 120 }}>
      <Tooltip content="This tooltip describes the button." delay={0}>
        <Button autoFocus>Focus shows tooltip</Button>
      </Tooltip>
    </div>
  ),
};
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Tooltip
git commit -m "feat: add Tooltip (composes Popover)"
```

---

## Task 3: Select (parallel — composes Popover)

**Files:**

- Create: `src/components/Select/Select.tsx`
- Create: `src/components/Select/Select.module.css`
- Create: `src/components/Select/Select.test.tsx`
- Create: `src/components/Select/Select.stories.tsx`
- Create: `src/components/Select/index.ts`

**API:** single-select listbox. `value`/`defaultValue` (string), `onChange(value, event)`, `options: { value: string; label: string; disabled?: boolean }[]`, `placeholder`, `label`, `disabled`, `error`, `helperText`, `size`.

- [ ] **Step 1: Write the failing test**

`src/components/Select/Select.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
];

describe('Select', () => {
  it('renders a labelled combobox trigger showing the placeholder', () => {
    render(<Select label="Fruit" placeholder="Pick one" options={options} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    expect(trigger).toHaveTextContent('Pick one');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the listbox on click and lists options', () => {
    render(<Select label="Fruit" options={options} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(3);
  });

  it('selects an option and reports the new value', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith('b', expect.anything());
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveTextContent('Banana');
  });

  it('moves the active option with ArrowDown and selects with Enter', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // -> Apple
    fireEvent.keyDown(listbox, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it('does not select a disabled option', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the trigger invalid and shows helper text on error', () => {
    render(<Select label="Fruit" options={options} error helperText="Required" />);
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Select/Select.test.tsx`
Expected: FAIL — cannot resolve `./Select`.

- [ ] **Step 3: Write the module CSS**

`src/components/Select/Select.module.css`:

```css
.root {
  display: inline-flex;
  flex-direction: column;
  gap: var(--ku-space-1);
}

.label {
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-secondary);
}

.trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ku-space-2);
  min-width: 12rem;
  padding: var(--ku-space-2) var(--ku-space-3);
  background: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
  border: 1px solid var(--ku-color-border-default);
  border-radius: var(--ku-radius-md);
  font: inherit;
  cursor: pointer;
}

.trigger[data-size='sm'] {
  padding: var(--ku-space-1) var(--ku-space-2);
}
.trigger[data-size='lg'] {
  padding: var(--ku-space-3) var(--ku-space-4);
}
.trigger[aria-invalid='true'] {
  border-color: var(--ku-color-border-danger);
}
.trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.placeholder {
  color: var(--ku-color-text-secondary);
}

.listbox {
  list-style: none;
  margin: 0;
  padding: var(--ku-space-1);
  min-width: 12rem;
  max-height: 16rem;
  overflow-y: auto;
}

.option {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  padding: var(--ku-space-2) var(--ku-space-3);
  border-radius: var(--ku-radius-sm);
  cursor: pointer;
}

.option[data-active='true'] {
  background: var(--ku-color-bg-muted);
}
.option[aria-selected='true'] {
  font-weight: var(--ku-font-weight-semibold);
}
.option[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.helperText {
  font-size: var(--ku-font-size-sm);
  color: var(--ku-color-text-secondary);
}
.helperText[data-error='true'] {
  color: var(--ku-color-text-danger);
}
```

> Confirm token names against `dist/theme.css`; substitute nearest existing token if needed.

- [ ] **Step 4: Write the implementation**

`src/components/Select/Select.tsx`:

```tsx
import { forwardRef, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Popover } from '../Popover';
import { useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Fires with the chosen value and the originating event. */
  onChange?: (value: string, event: React.SyntheticEvent) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  size?: SelectSize;
  className?: string;
  id?: string;
}

export const Select = /* @__PURE__ */ forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    defaultValue,
    onChange,
    options,
    placeholder = 'Select…',
    label,
    disabled,
    error,
    helperText,
    size = 'md',
    className,
    id,
  },
  ref,
) {
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const baseId = useId(id ?? 'select');
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === selected);

  const choose = (opt: SelectOption, event: React.SyntheticEvent) => {
    if (opt.disabled) return;
    setSelected(opt.value);
    onChange?.(opt.value, event);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    const n = options.length;
    let i = activeIndex;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (!options[i]?.disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(options.findIndex((o) => !o.disabled));
        break;
      case 'End':
        event.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i].disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) choose(options[activeIndex], event);
        break;
      default:
        break;
    }
  };

  const trigger = (
    <button
      ref={ref}
      type="button"
      id={baseId}
      className={cx(styles.trigger)}
      data-size={size}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      aria-labelledby={label ? `${labelId} ${baseId}` : undefined}
      aria-invalid={error || undefined}
      onClick={() => setOpen((o) => !o)}
    >
      <span className={selectedOption ? undefined : styles.placeholder}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <span aria-hidden>▾</span>
    </button>
  );

  return (
    <div className={cx(styles.root, className)}>
      {label != null ? (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      ) : null}

      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-start"
        role="presentation"
        trigger={trigger}
      >
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={label ? labelId : undefined}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          className={styles.listbox}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              id={optionId(i)}
              role="option"
              aria-selected={opt.value === selected}
              aria-disabled={opt.disabled || undefined}
              data-active={i === activeIndex ? 'true' : undefined}
              className={styles.option}
              onClick={(e) => choose(opt, e)}
              onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </Popover>

      {helperText != null ? (
        <span className={styles.helperText} data-error={error ? 'true' : undefined}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
});
```

> Focus note: when the listbox opens, move focus to it so keyboard nav works. Add an effect that calls `listRef.current?.focus()` when `open` becomes true, and returns focus to the trigger on close. Keep it minimal; the unit tests above fire `keyDown` on the listbox directly, so the effect is for real-browser UX (validated in the story/e2e). Implement it if you add interaction tests that rely on focus.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Select/Select.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the barrel export**

`src/components/Select/index.ts`:

```ts
export { Select } from './Select';
export type { SelectProps, SelectOption, SelectSize } from './Select';
```

- [ ] **Step 7: Write stories (open state for axe/visual)**

`src/components/Select/Select.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Select } from './Select';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

const meta = {
  title: 'Components/Select',
  component: Select,
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Country', options, placeholder: 'Choose a country' },
  render: function DefaultStory(args) {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40 }}>
        <Select {...args} value={value} onChange={(v) => setValue(v)} />
      </div>
    );
  },
};

// Renders selected + error states; Default story is the open-state axe target.
export const Showcase: Story = {
  args: { label: 'Country', options },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 40 }}>
      <Select label="Default" options={options} placeholder="Choose…" />
      <Select label="Selected" options={options} defaultValue="ca" />
      <Select label="Error" options={options} error helperText="Required" />
      <Select label="Disabled" options={options} disabled placeholder="Choose…" />
    </div>
  ),
};
```

> The e2e a11y target story should open the listbox. Either set `defaultOpen` support is not present on `Select`, so author a dedicated `Open` story controlled to `open` — OR point the e2e entry at `Default` and have the e2e test click the trigger before running axe. Simplest: add an `Open` story that renders with the listbox visible by managing internal state via an effect. The integration session (Task 5) picks the story id; coordinate the story name there.

- [ ] **Step 8: Commit**

```bash
git add src/components/Select
git commit -m "feat: add Select (single-choice listbox, composes Popover)"
```

---

## Task 4: Menu (parallel — composes Popover)

**Files:**

- Create: `src/components/Menu/Menu.tsx`
- Create: `src/components/Menu/Menu.module.css`
- Create: `src/components/Menu/Menu.test.tsx`
- Create: `src/components/Menu/Menu.stories.tsx`
- Create: `src/components/Menu/index.ts`

**API:** `trigger` (a single element rendered via Slot), `items` (array of `MenuItem | MenuSeparator`), `placement`. A `MenuItem` is `{ label, onSelect, disabled?, icon? }`; a separator is `{ type: 'separator' }`.

- [ ] **Step 1: Write the failing test**

`src/components/Menu/Menu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Menu } from './Menu';

function setup(onSelect = vi.fn()) {
  render(
    <Menu
      trigger={<button type="button">Actions</button>}
      items={[
        { label: 'Edit', onSelect },
        { label: 'Duplicate', onSelect: () => {} },
        { type: 'separator' },
        { label: 'Delete', onSelect: () => {}, disabled: true },
      ]}
    />,
  );
  return { onSelect };
}

describe('Menu', () => {
  it('renders a trigger with menu semantics', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the menu and lists enabled items as menuitems', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('invokes onSelect and closes when an item is activated', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('does not activate a disabled item', () => {
    const onDelete = vi.fn();
    render(
      <Menu
        trigger={<button type="button">Actions</button>}
        items={[{ label: 'Delete', onSelect: onDelete, disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('moves focus with ArrowDown and activates with Enter', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // first item: Edit
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Menu/Menu.test.tsx`
Expected: FAIL — cannot resolve `./Menu`.

- [ ] **Step 3: Write the module CSS**

`src/components/Menu/Menu.module.css`:

```css
.menu {
  list-style: none;
  margin: 0;
  padding: var(--ku-space-1);
  min-width: 10rem;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  width: 100%;
  padding: var(--ku-space-2) var(--ku-space-3);
  border: none;
  background: none;
  border-radius: var(--ku-radius-sm);
  font: inherit;
  color: var(--ku-color-text-primary);
  text-align: left;
  cursor: pointer;
}

.item[data-active='true'] {
  background: var(--ku-color-bg-muted);
}
.item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  display: inline-flex;
  width: 1rem;
}

.separator {
  height: 1px;
  margin: var(--ku-space-1) 0;
  background: var(--ku-color-border-default);
}
```

> Confirm token names against `dist/theme.css`; substitute nearest existing token if needed.

- [ ] **Step 4: Write the implementation**

`src/components/Menu/Menu.tsx`:

```tsx
import { forwardRef, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Popover } from '../Popover';
import type { PopoverPlacement } from '../Popover';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Menu.module.css';

export interface MenuItemConfig {
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}
export interface MenuSeparator {
  type: 'separator';
}
export type MenuEntry = MenuItemConfig | MenuSeparator;

export interface MenuProps {
  /** Single trigger element, rendered via Slot. */
  trigger: ReactElement;
  /** Menu entries (items and separators). */
  items: MenuEntry[];
  /** Anchored placement. Defaults to 'bottom-start'. */
  placement?: PopoverPlacement;
  className?: string;
}

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return (entry as MenuSeparator).type === 'separator';
}

export const Menu = /* @__PURE__ */ forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { trigger, items, placement = 'bottom-start', className },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const baseId = useId('menu');
  const menuRef = useRef<HTMLUListElement>(null);

  // Indices of selectable (non-separator, non-disabled) items.
  const itemIndices = items
    .map((entry, i) => ({ entry, i }))
    .filter(({ entry }) => !isSeparator(entry) && !(entry as MenuItemConfig).disabled)
    .map(({ i }) => i);

  const activate = (entry: MenuItemConfig) => {
    if (entry.disabled) return;
    entry.onSelect();
    setOpen(false);
  };

  const move = (delta: number) => {
    if (itemIndices.length === 0) return;
    const pos = itemIndices.indexOf(activeIndex);
    const nextPos = (pos + delta + itemIndices.length) % itemIndices.length;
    setActiveIndex(itemIndices[nextPos]);
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(itemIndices[0] ?? -1);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(itemIndices[itemIndices.length - 1] ?? -1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const entry = items[activeIndex];
        if (entry && !isSeparator(entry)) activate(entry);
        break;
      }
      default:
        break;
    }
  };

  const triggerEl = {
    ...trigger,
    props: {
      ...trigger.props,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      onClick: (e: React.MouseEvent) => {
        (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
        setOpen((o) => !o);
      },
    },
  } as ReactElement;

  return (
    <Popover
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      role="presentation"
      trigger={triggerEl}
      className={className}
    >
      <ul
        ref={menuRef}
        id={baseId}
        role="menu"
        tabIndex={-1}
        className={cx(styles.menu)}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((entry, i) =>
          isSeparator(entry) ? (
            <li key={`sep-${i}`} role="separator" className={styles.separator} />
          ) : (
            <li key={i} role="none">
              <button
                type="button"
                role="menuitem"
                className={styles.item}
                data-active={i === activeIndex ? 'true' : undefined}
                disabled={entry.disabled}
                tabIndex={-1}
                onClick={() => activate(entry)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {entry.icon ? (
                  <span className={styles.icon} aria-hidden>
                    {entry.icon}
                  </span>
                ) : null}
                {entry.label}
              </button>
            </li>
          ),
        )}
      </ul>
    </Popover>
  );
});
```

> Focus note (as in Select): for real-browser UX, focus the menu (`menuRef.current?.focus()`) when it opens and return focus to the trigger on close. The unit tests fire `keyDown` on the menu directly and don't require it. Add the effect for UX; validated in the story/e2e.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Menu/Menu.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Write the barrel export**

`src/components/Menu/index.ts`:

```ts
export { Menu } from './Menu';
export type { MenuProps, MenuEntry, MenuItemConfig, MenuSeparator } from './Menu';
```

- [ ] **Step 7: Write stories (open state for axe/visual)**

`src/components/Menu/Menu.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import { Button } from '../Button';

const items = [
  { label: 'Edit', onSelect: () => {} },
  { label: 'Duplicate', onSelect: () => {} },
  { type: 'separator' as const },
  { label: 'Delete', onSelect: () => {}, disabled: true },
];

const meta = {
  title: 'Components/Menu',
  component: Menu,
} satisfies Meta<typeof Menu>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: <Button>Actions</Button>, items },
  render: (args) => (
    <div style={{ padding: 40 }}>
      <Menu {...args} />
    </div>
  ),
};

// The Default story's menu opens on click; the e2e test clicks before axe.
export const Showcase: Story = {
  args: { trigger: <Button>Actions</Button>, items },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 40 }}>
      <Menu trigger={<Button>Open actions menu</Button>} items={items} />
    </div>
  ),
};
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Menu
git commit -m "feat: add Menu (actions menu, composes Popover)"
```

---

## Task 5: Integration, full gate, and merge (main session only)

**Files:**

- Modify: `src/index.ts`
- Modify: `e2e/components.spec.ts:16-40`
- Modify: `README.md`

- [ ] **Step 1: Add exports to `src/index.ts`**

Append after the Phase 6 overlay exports (`src/index.ts:78`):

```ts
// Phase 7 — floating components (Popover API + CSS anchor positioning)
export { Popover } from './components/Popover';
export type { PopoverProps, PopoverPlacement } from './components/Popover';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';
export { Select } from './components/Select';
export type { SelectProps, SelectOption, SelectSize } from './components/Select';
export { Menu } from './components/Menu';
export type { MenuProps, MenuEntry, MenuItemConfig, MenuSeparator } from './components/Menu';
```

- [ ] **Step 2: Add e2e entries**

In `e2e/components.spec.ts`, add to the `COMPONENTS` array (after the `Snackbar` entry):

```ts
  { name: 'Popover', storyId: 'components-popover--showcase' },
  { name: 'Tooltip', storyId: 'components-tooltip--showcase' },
  { name: 'Select', storyId: 'components-select--showcase' },
  { name: 'Menu', storyId: 'components-menu--showcase' },
```

> For `Select`/`Menu`, whose floating content is closed until interaction, ensure the chosen story renders the listbox/menu open (use a story that mounts open, or add a `beforeEach` interaction that clicks the trigger for those storyIds) so axe inspects the rendered popup. Mirror the open-state convention from the Snackbar/Dialog stories.

- [ ] **Step 3: Run typecheck (catches DOM-prop-collision Omit misses)**

Run: `npm run typecheck`
Expected: PASS (no errors). If a collision error appears (`open`/`value`/`onChange`/`placement`/`content`), add the missing key to the component's `Omit<...>`.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Run unit tests (all)**

Run: `npm test`
Expected: PASS — previous 152 + the new Popover/Tooltip/Select/Menu tests.

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: build success (CJS + ESM + .d.ts), `dist/theme.css` regenerated.

- [ ] **Step 7: Verify bundle tree-shaking**

Run: `npm run verify:bundle`
Expected: PASS.

- [ ] **Step 8: Regenerate local visual baselines and run e2e**

Run: `npx playwright test --update-snapshots` (regenerates local, gitignored baselines), then `npm run test:e2e`
Expected: e2e PASS — zero axe violations in dark and light for all four new components.

> Do **not** commit local snapshot images — they are platform-specific and gitignored. Real axe failures (e.g. contrast) are fixed in the component CSS, never by disabling the rule.

- [ ] **Step 9: Update README status block**

Add `Popover`, `Tooltip`, `Select`, `Menu` to the component list/status table in `README.md`, matching the existing format.

- [ ] **Step 10: Commit the integration**

```bash
git add src/index.ts e2e/components.spec.ts README.md
git commit -m "feat: integrate Phase 7 floating components (exports, e2e, README)"
```

- [ ] **Step 11: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to branch + fast-forward merge to `main`, mirroring how Phases 5–6 landed. Leave the version bump to `1.2.0`, `CHANGELOG.md`, tag, and GitHub Release to the maintainer (release is maintainer-controlled, as in v1/v1.1).

---

## Self-Review Notes (for the executor)

- **Spec coverage:** Popover (foundation) = Task 1; Tooltip = Task 2; Select (single-choice) = Task 3; Menu = Task 4; exports/e2e/README/gate/merge = Task 5. Native-first positioning (Popover API + CSS anchor) is in Task 1's CSS + sync effect. Graceful degradation is the Snackbar-derived guard in Task 1 Step 4.
- **Token names** in the CSS steps (`--ku-color-bg-surface`, `--ku-shadow-md`, `--ku-space-*`, `--ku-radius-*`, `--ku-font-*`) must be verified against the generated `dist/theme.css` / `src/theme/tokens.ts` and swapped for the nearest existing token if a name differs — never invent a token.
- **Open-state stories for axe:** Popover and Tooltip Showcase stories render open; Select and Menu open on interaction, so the e2e entry (Task 5 Step 2) must open them before axe runs. Resolve the exact story/interaction during integration.
- **Focus management** for Select/Menu (focus the popup on open, restore to trigger on close) is real-browser UX described in notes; the unit tests don't depend on it but it should ship for keyboard users.
