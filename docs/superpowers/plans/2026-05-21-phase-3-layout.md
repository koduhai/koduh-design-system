# Phase 3 — Layout Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two Phase 3 layout components of `@koduhai/design-system` v1 — `AppBar` and `Sidebar` — using the Phase 0 foundations and the patterns established in Phases 1–2.

**Architecture:** Each component is a focused folder (`Component.tsx` + `Component.module.css` + `Component.test.tsx` + `Component.stories.tsx` + `index.ts`). Variants are `data-*` attributes on the root, styled by scoped CSS-Module selectors. `AppBar` renders a `<header>` landmark; `Sidebar` renders a `<nav>` landmark with a labeled collapse toggle and a flat list of link/button items. `Sidebar` is the only stateful component (collapsed state via `useControllableState`, controlled/uncontrolled). Both consume only `--ku-*` CSS variables, compose Phase-0 primitives, forward refs, and spread remaining DOM props to the root. There is intentionally NO portal/focus-trap (Sidebar is pure layout — confirmed by spec §7).

**Design decisions (user-confirmed):**

- `SidebarItem` is a **flat** model: `{ id, label, icon?, href?, active?, disabled?, onClick? }`. No nesting/groups (YAGNI).
- The active item conveys current-page state with **`aria-current="page"`** plus a visual indicator.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules (`local-css` scoping via tsup), Vitest + React Testing Library, Playwright + axe-core, Storybook 10.

**Reference spec:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (§7 component table, §8 API principles, §9 a11y). **Reference implementations:** `src/components/Button/` (data-attr styling, asChild), `src/components/TextField/` (controlled/uncontrolled via `useControllableState` + `useId`).

---

## Foundation contract (already built — do NOT rebuild)

- **Primitives** (`src/primitives`, re-exported from `src/index.ts`): `Slot`, `VisuallyHidden`, `mergeRefs`, `composeEventHandlers`, `useId`, `useControllableState`. Type `SlotProps`.
- **`useId(prefix?)`** returns a stable SSR-safe id string. **`useControllableState<T>({ value, defaultValue, onChange })`** returns `[state, setState]` — controlled when `value !== undefined`, else internal state seeded from `defaultValue`; `setState(next)` updates internal state (when uncontrolled) and always calls `onChange?.(next)`. (See `src/primitives/useControllableState.ts`.)
- **Icons** (`src/icons`): `createIcon` + `CloseIcon, ChevronDownIcon, CheckIcon, InfoIcon, WarningIcon, ErrorIcon, MenuIcon, SearchIcon, UserIcon`. `IconProps` has `size?` and `title?` (decorative/`aria-hidden` by default).
- **`cx`** (`src/utils/cx.ts`, exported from `src/index.ts`): `cx(...parts) => string`, drops falsy values.
- **CSS variables available** (from `dist/theme.css`): colors `--ku-color-{primary,primary-contrast,danger,success,warning,info,bg-default,bg-surface,bg-raised,border,text-primary,text-secondary,text-disabled}`; spacing `--ku-space-{1,2,3,4,5,6,8,10,12}`; radius `--ku-radius-{sm,md,lg,full}`; font `--ku-font-family-{base,mono}`, `--ku-font-size-{xs,sm,md,lg,xl,2xl}`, `--ku-font-weight-{regular,medium,semibold,bold}`, `--ku-line-height-{tight,base,relaxed}`; `--ku-shadow-{1,2,3}`; `--ku-duration-{fast,base}`, `--ku-easing-standard`.
- **Build/CSS Modules:** `.module.css` class selectors get scoped (`[filename]_[local]`); element/attribute/pseudo selectors are NOT scoped — so `.root[data-collapsed='true']` works. **Name each module file after its component.**
- **Gates:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.

---

## File Structure (this phase)

```
src/components/
├── AppBar/    AppBar.tsx    AppBar.module.css    AppBar.test.tsx    AppBar.stories.tsx    index.ts
└── Sidebar/   Sidebar.tsx   Sidebar.module.css   Sidebar.test.tsx   Sidebar.stories.tsx   index.ts
src/index.ts                   # MODIFY (integration task): add the 2 component export blocks
e2e/components.spec.ts         # MODIFY (integration task): add 2 stories to the COMPONENTS list
README.md                      # MODIFY (integration task): update status block
```

> **Coordination note (parallel build):** Tasks 1–2 are independent and touch NO shared files — each touches only its own `src/components/<Name>/` directory. They are built by parallel subagents. Integration of `src/index.ts`, `e2e/components.spec.ts`, and `README.md` (Task 3) is done by the dispatching session AFTER both component tasks land. Component tasks do NOT edit shared files and do NOT commit (the parent commits, to avoid `.git/index.lock` races).

---

## Task 1: AppBar

**Files:**

- Create: `src/components/AppBar/AppBar.tsx`, `AppBar.module.css`, `AppBar.test.tsx`, `AppBar.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/AppBar/AppBar.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders a header (banner) landmark', () => {
    render(<AppBar title="Koduh" />);
    const banner = screen.getByRole('banner');
    expect(banner.tagName).toBe('HEADER');
    expect(banner).toHaveTextContent('Koduh');
  });

  it('renders logo, title, and actions', () => {
    render(
      <AppBar
        logo={<span data-testid="logo" />}
        title="Dashboard"
        actions={<button>Profile</button>}
      />,
    );
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
  });

  it('defaults to static position with elevation, reflected as data attributes', () => {
    render(<AppBar title="X" />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('data-position', 'static');
    expect(banner).toHaveAttribute('data-elevation', 'true');
  });

  it('reflects position and elevation overrides', () => {
    render(<AppBar title="X" position="sticky" elevation={false} />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('data-position', 'sticky');
    expect(banner).not.toHaveAttribute('data-elevation');
  });

  it('forwards a ref and arbitrary props to the header root', () => {
    const ref = { current: null as HTMLElement | null };
    render(<AppBar ref={ref} title="X" data-testid="bar" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(screen.getByTestId('bar')).toBe(ref.current);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/AppBar/AppBar.test.tsx`
Expected: FAIL — cannot resolve `./AppBar`.

- [ ] **Step 3: Write the component** — `src/components/AppBar/AppBar.tsx`

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './AppBar.module.css';

export type AppBarPosition = 'static' | 'sticky';

export interface AppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Brand mark shown at the start. */
  logo?: ReactNode;
  /** App or page title shown next to the logo. */
  title?: ReactNode;
  /** Right-aligned actions (buttons, avatar, menu). */
  actions?: ReactNode;
  /** Scroll behavior. Defaults to 'static'. */
  position?: AppBarPosition;
  /** Adds a bottom border + shadow. Defaults to true. */
  elevation?: boolean;
}

export const AppBar = forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { logo, title, actions, position = 'static', elevation = true, className, children, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cx(styles.root, className)}
      data-position={position}
      data-elevation={elevation ? 'true' : undefined}
      {...props}
    >
      <div className={styles.start}>
        {logo ? <span className={styles.logo}>{logo}</span> : null}
        {title ? <span className={styles.title}>{title}</span> : null}
        {children}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
});
```

- [ ] **Step 4: Write the styles** — `src/components/AppBar/AppBar.module.css`

```css
.root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ku-space-4);
  min-height: 56px;
  padding: 0 var(--ku-space-4);
  background-color: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
  font-family: var(--ku-font-family-base);
  border-bottom: 1px solid transparent;
}

.root[data-position='sticky'] {
  position: sticky;
  top: 0;
  z-index: 10;
}

.root[data-elevation='true'] {
  border-bottom-color: var(--ku-color-border);
  box-shadow: var(--ku-shadow-1);
}

.start {
  display: flex;
  align-items: center;
  gap: var(--ku-space-3);
  min-width: 0;
}

.logo {
  display: inline-flex;
  align-items: center;
}

.title {
  font-size: var(--ku-font-size-lg);
  font-weight: var(--ku-font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--ku-space-2);
  flex-shrink: 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/AppBar/AppBar.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Write stories** — `src/components/AppBar/AppBar.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from './AppBar';
import { Button } from '../Button';
import { Avatar } from '../Avatar';

const meta = {
  title: 'Components/AppBar',
  component: AppBar,
} satisfies Meta<typeof AppBar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { title: 'Koduh AI' } };

export const Showcase: Story = {
  args: { title: 'Koduh AI' },
  // Each AppBar is wrapped in a labeled <section> so its <header> is NOT a
  // top-level `banner` landmark — otherwise two AppBars would trip axe's
  // "landmark-no-duplicate-banner" rule in the story fragment.
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 600 }}>
      <section aria-label="With actions">
        <AppBar
          title="Koduh AI"
          actions={
            <>
              <Button variant="ghost" tone="neutral">
                Docs
              </Button>
              <Avatar name="Ada Lovelace" size="sm" />
            </>
          }
        />
      </section>
      <section aria-label="No elevation">
        <AppBar title="No elevation" elevation={false} actions={<Button size="sm">New</Button>} />
      </section>
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/AppBar/index.ts`

```ts
export { AppBar } from './AppBar';
export type { AppBarProps, AppBarPosition } from './AppBar';
```

- [ ] **Step 8: Verify the component test passes** (do NOT run project-wide typecheck/lint while building in parallel)

Run: `npx vitest run src/components/AppBar/AppBar.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 9: Done — leave files uncommitted for the parent session.**

---

## Task 2: Sidebar

**Files:**

- Create: `src/components/Sidebar/Sidebar.tsx`, `Sidebar.module.css`, `Sidebar.test.tsx`, `Sidebar.stories.tsx`, `index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/Sidebar/Sidebar.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { SidebarItem } from './Sidebar';

const ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Home', href: '/', active: true },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'settings', label: 'Settings', onClick: () => {} },
];

describe('Sidebar', () => {
  it('renders a nav landmark with a default accessible name', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument();
  });

  it('honors a custom aria-label', () => {
    render(<Sidebar items={ITEMS} aria-label="Main navigation" />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders href items as links and onClick-only items as buttons', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current="page"', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');
  });

  it('fires an item onClick', async () => {
    const onClick = vi.fn();
    render(<Sidebar items={[{ id: 'a', label: 'Action', onClick }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables a disabled item (rendered as a disabled button)', () => {
    render(<Sidebar items={[{ id: 'x', label: 'Off', href: '/x', disabled: true }]} />);
    const btn = screen.getByRole('button', { name: 'Off' });
    expect(btn).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Off' })).toBeNull();
  });

  it('toggles collapsed state (uncontrolled) and updates the toggle label + aria-expanded', async () => {
    render(<Sidebar items={ITEMS} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    const expandToggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expandToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects controlled collapsed and calls onToggle without changing state itself', async () => {
    const onToggle = vi.fn();
    const { container } = render(<Sidebar items={ITEMS} collapsed onToggle={onToggle} />);
    const nav = container.querySelector('nav')!;
    expect(nav).toHaveAttribute('data-collapsed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(nav).toHaveAttribute('data-collapsed', 'true'); // controlled — unchanged
  });

  it('renders header and footer slots', () => {
    render(
      <Sidebar
        items={ITEMS}
        header={<span data-testid="head" />}
        footer={<span data-testid="foot" />}
      />,
    );
    expect(screen.getByTestId('head')).toBeInTheDocument();
    expect(screen.getByTestId('foot')).toBeInTheDocument();
  });

  it('keeps item labels accessible even when collapsed', () => {
    render(<Sidebar items={ITEMS} defaultCollapsed />);
    // Labels are visually hidden (not display:none), so the accessible name persists.
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('forwards a ref to the nav element', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Sidebar items={ITEMS} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Sidebar/Sidebar.test.tsx`
Expected: FAIL — cannot resolve `./Sidebar`.

- [ ] **Step 3: Write the component** — `src/components/Sidebar/Sidebar.tsx`

```tsx
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { MenuIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  /** Stable key. */
  id: string;
  /** Visible text; also the accessible name. */
  label: string;
  /** Leading icon (decorative). */
  icon?: ReactNode;
  /** When set (and not disabled), the item renders as an <a>. */
  href?: string;
  /** Marks the current page (aria-current="page" + visual indicator). */
  active?: boolean;
  /** Renders a disabled <button> and ignores href. */
  disabled?: boolean;
  /** Click handler (used for button items, or alongside an href link). */
  onClick?: () => void;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Flat list of navigation items. */
  items: SidebarItem[];
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. Defaults to false. */
  defaultCollapsed?: boolean;
  /** Called with the next collapsed value when the toggle is pressed. */
  onToggle?: (collapsed: boolean) => void;
  /** Expanded width (number → px). Defaults to 240. */
  width?: number | string;
  /** Content above the item list (e.g. brand). */
  header?: ReactNode;
  /** Content pinned below the item list (e.g. user menu). */
  footer?: ReactNode;
}

function SidebarItemControl({ item }: { item: SidebarItem }) {
  const content = (
    <>
      {item.icon ? (
        <span className={styles.icon} aria-hidden>
          {item.icon}
        </span>
      ) : null}
      <span className={styles.label}>{item.label}</span>
    </>
  );
  const common = {
    className: styles.link,
    'data-active': item.active ? 'true' : undefined,
    'aria-current': item.active ? ('page' as const) : undefined,
  };

  if (item.href && !item.disabled) {
    return (
      <a href={item.href} onClick={item.onClick} {...common}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" disabled={item.disabled} onClick={item.onClick} {...common}>
      {content}
    </button>
  );
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    items,
    collapsed,
    defaultCollapsed = false,
    onToggle,
    width = 240,
    header,
    footer,
    className,
    style,
    'aria-label': ariaLabel = 'Sidebar',
    ...props
  },
  ref,
) {
  const [isCollapsed, setCollapsed] = useControllableState<boolean>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: onToggle,
  });
  const listId = useId('sidebar-list');
  const widthValue = typeof width === 'number' ? `${width}px` : width;

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={cx(styles.root, className)}
      data-collapsed={isCollapsed ? 'true' : undefined}
      style={{ ...style, '--ku-sidebar-width': widthValue } as CSSProperties}
      {...props}
    >
      <div className={styles.top}>
        {header ? <div className={styles.header}>{header}</div> : null}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!isCollapsed}
          aria-controls={listId}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          <MenuIcon size={20} />
        </button>
      </div>
      <ul id={listId} className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <SidebarItemControl item={item} />
          </li>
        ))}
      </ul>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </nav>
  );
});
```

> **`--ku-sidebar-width` custom property:** TypeScript's `CSSProperties` doesn't include arbitrary custom properties, so the `style` object is cast `as CSSProperties` after adding the variable. This matches how inline CSS variables are typed elsewhere in React+TS.

- [ ] **Step 4: Write the styles** — `src/components/Sidebar/Sidebar.module.css`

```css
.root {
  display: flex;
  flex-direction: column;
  width: var(--ku-sidebar-width, 240px);
  height: 100%;
  background-color: var(--ku-color-bg-surface);
  border-right: 1px solid var(--ku-color-border);
  color: var(--ku-color-text-primary);
  font-family: var(--ku-font-family-base);
  transition: width var(--ku-duration-base) var(--ku-easing-standard);
}

.root[data-collapsed='true'] {
  width: 64px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ku-space-2);
  padding: var(--ku-space-3);
  min-height: 56px;
}

.header {
  min-width: 0;
  overflow: hidden;
}
.root[data-collapsed='true'] .header {
  display: none;
}

.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--ku-radius-md);
  color: var(--ku-color-text-secondary);
  cursor: pointer;
}
.toggle:hover {
  background-color: var(--ku-color-bg-raised);
  color: var(--ku-color-text-primary);
}

.list {
  list-style: none;
  margin: 0;
  padding: var(--ku-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.item {
  display: block;
}

.link {
  display: flex;
  align-items: center;
  gap: var(--ku-space-3);
  width: 100%;
  padding: var(--ku-space-2) var(--ku-space-3);
  border: 0;
  border-radius: var(--ku-radius-md);
  background: transparent;
  color: var(--ku-color-text-secondary);
  font: inherit;
  font-size: var(--ku-font-size-sm);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}
.link:hover:not(:disabled) {
  background-color: var(--ku-color-bg-raised);
  color: var(--ku-color-text-primary);
}
.link[data-active='true'] {
  background-color: color-mix(in srgb, var(--ku-color-primary) 16%, transparent);
  color: var(--ku-color-primary);
  font-weight: var(--ku-font-weight-medium);
}
.link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Collapsed: hide labels visually but keep them in the accessibility tree
   (clip technique, NOT display:none) so each link/button keeps its name. */
.root[data-collapsed='true'] .label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.root[data-collapsed='true'] .link {
  justify-content: center;
}

.footer {
  padding: var(--ku-space-3);
  border-top: 1px solid var(--ku-color-border);
}
.root[data-collapsed='true'] .footer {
  display: none;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/Sidebar/Sidebar.test.tsx`
Expected: PASS (11 tests).

- [ ] **Step 6: Write stories** — `src/components/Sidebar/Sidebar.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './Sidebar';
import type { SidebarItem } from './Sidebar';
import { UserIcon, SearchIcon, MenuIcon } from '../../icons';

const items: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: <MenuIcon size={18} />, href: '#home', active: true },
  { id: 'search', label: 'Search', icon: <SearchIcon size={18} />, href: '#search' },
  { id: 'profile', label: 'Profile', icon: <UserIcon size={18} />, href: '#profile' },
  { id: 'disabled', label: 'Disabled', icon: <UserIcon size={18} />, href: '#x', disabled: true },
];

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items },
  render: (args) => (
    <div style={{ height: 360, display: 'flex' }}>
      <Sidebar {...args} />
    </div>
  ),
};

export const Showcase: Story = {
  args: { items },
  // Two <nav> landmarks must have UNIQUE accessible names, or axe flags
  // "landmark-unique". Give each a distinct aria-label.
  render: () => (
    <div style={{ display: 'flex', gap: 24, height: 360 }}>
      <Sidebar
        items={items}
        aria-label="Primary"
        header={<strong>Koduh</strong>}
        footer={<small>v1.0</small>}
      />
      <Sidebar
        items={items}
        aria-label="Collapsed example"
        defaultCollapsed
        header={<strong>K</strong>}
      />
    </div>
  ),
};
```

- [ ] **Step 7: Create the barrel** — `src/components/Sidebar/index.ts`

```ts
export { Sidebar } from './Sidebar';
export type { SidebarProps, SidebarItem } from './Sidebar';
```

- [ ] **Step 8: Verify the component test passes** (do NOT run project-wide typecheck/lint while building in parallel)

Run: `npx vitest run src/components/Sidebar/Sidebar.test.tsx`
Expected: PASS (11 tests).

- [ ] **Step 9: Done — leave files uncommitted for the parent session.**

---

## Task 3: Integration — exports, e2e, README, full gate

> **Done by the dispatching session AFTER Tasks 1–2 land.** This is the only task that touches shared files.

**Files:**

- Modify: `src/index.ts`
- Modify: `e2e/components.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Add the two export blocks to `src/index.ts`**

Append below the existing `PageHeader` export block:

```ts
export { AppBar } from './components/AppBar';
export type { AppBarProps, AppBarPosition } from './components/AppBar';
export { Sidebar } from './components/Sidebar';
export type { SidebarProps, SidebarItem } from './components/Sidebar';
```

- [ ] **Step 2: Add the two components to the `COMPONENTS` array in `e2e/components.spec.ts`**

After the `PageHeader` entry, add:

```ts
  { name: 'AppBar', storyId: 'components-appbar--showcase' },
  { name: 'Sidebar', storyId: 'components-sidebar--showcase' },
```

- [ ] **Step 3: Run the unit suite + typecheck + lint (whole project, now that all files exist)**

```bash
npm run typecheck   # Expected: PASS
npm run lint        # Expected: PASS
npm test            # Expected: PASS — all suites incl. AppBar (5) + Sidebar (11)
```

> If typecheck flags the `'--ku-sidebar-width'` custom property on the `style` object, confirm the `as CSSProperties` cast from Task 2 Step 3 is present.

- [ ] **Step 4: Build and confirm the new component CSS is bundled**

```bash
npm run build
node -e "const s=require('fs').readFileSync('C:/dev/work/koduhai-design-system-v2/dist/index.css','utf8'); for (const n of ['AppBar_root','Sidebar_root']) console.log(n, new RegExp(n).test(s));"
```

Expected: build succeeds; both `AppBar_root` and `Sidebar_root` print `true`.

- [ ] **Step 5: Run the axe a11y e2e for the new components (both themes)**

Run: `npm run test:e2e -- --grep axe`
Expected: all axe tests pass (existing 10 components + 2 new = 24 component tests + 2 foundations, both themes), zero violations.

> If a real violation appears (e.g. the Sidebar toggle missing a name, or a collapsed label dropping out of the a11y tree), FIX the component — never disable a rule for a component.

- [ ] **Step 6: Regenerate + verify visual snapshot baselines for the new components**

```bash
npx playwright test --grep visual --update-snapshots   # writes AppBar/Sidebar baselines
npx playwright test --grep visual                       # confirms all visual tests pass
```

Expected: new `e2e/components.spec.ts-snapshots/components-{appbar,sidebar}--showcase-{dark,light}-chromium-win32.png` written; full visual suite passes. (Baselines are gitignored per `e2e/.gitignore` — do NOT commit them.)

- [ ] **Step 7: Update README status block**

In `README.md`, update the `> **Status:**` paragraph to add Phase 3 (layout — `AppBar`, `Sidebar`) to the completed list and note only Phase 4 (polish & release) remains.

- [ ] **Step 8: Commit (component folders + integration; NOT the gitignored snapshots)**

```bash
git add src/components/AppBar src/components/Sidebar src/index.ts e2e/components.spec.ts README.md docs/superpowers/plans/2026-05-21-phase-3-layout.md
git commit -m "feat: add Phase 3 layout components (AppBar, Sidebar)"
```

---

## Self-Review Notes (spec coverage)

- **§7 components** → AppBar (Task 1), Sidebar (Task 2). Each implements the spec's key props and a11y notes:
  - AppBar: `logo`, `title`, `actions`, `position` (static/sticky), `elevation`; renders `<header>` (banner) landmark; actions are real keyboard-reachable controls.
  - Sidebar: `items`, `collapsed`/`defaultCollapsed`/`onToggle` (controlled+uncontrolled), `width`, `header`, `footer`; `<nav>` landmark with accessible name; toggle is a labeled `<button>` with `aria-expanded`/`aria-controls`; current item `aria-current="page"`; flat item model (user-confirmed); pure layout, no focus trap; collapsed labels stay in the a11y tree via the clip technique.
- **§8 clean-break API** → semantic props, controlled/uncontrolled symmetry (Sidebar collapse via `useControllableState`), explicit typed props (only standard DOM attrs spread), `SidebarItem`/`AppBarPosition`/etc. all exported.
- **§9 accessibility** → axe e2e both themes (Task 3 Step 5); nav/banner landmarks; labeled toggle; `aria-current`; color never the sole signal for the active item (background + weight + indicator).
- **§10 testing** → Vitest unit per component (Tasks 1–2), axe e2e + visual snapshots wired into `e2e/components.spec.ts` (Task 3).
- **§11 build** → component `.module.css` scoped + bundled into `dist/index.css` (verified Task 3 Step 4).

**Deferred to Phase 4:** bundle/tree-shaking audit, full a11y audit, wiring visual-snapshot baselines into CI on the CI platform, v1.0.0 release.
