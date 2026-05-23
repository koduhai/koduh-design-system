# Phase 5 — Tier 1 Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 9 form-control, presentational, and navigation components (`Checkbox`, `Radio`/`RadioGroup`, `Switch`, `Spinner`, `Skeleton`, `Divider`, `Accordion`, `Breadcrumbs`, `Tabs`) to `@koduhai/design-system`, each a self-contained `src/components/<Name>/` folder, with zero new infrastructure.

**Architecture:** Layer-3 components only. Each consumes design tokens via CSS variables and composes existing Layer-2 primitives (`useId`, `useControllableState`, `cx`, `Slot`/`asChild`, `composeEventHandlers`, `VisuallyHidden`). Variant styling via data-attributes selected on in `.module.css`, exactly like `src/components/Button/`. No portals, no focus traps.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules, Vitest + Testing Library + `@testing-library/user-event`, Storybook 10, Playwright + axe-core.

**Spec:** `docs/superpowers/specs/2026-05-22-component-expansion-v1.1-design.md`

---

## How this plan is executed (parallel-subagent workflow)

Each **Task below is built by one subagent** working **only** inside its own `src/components/<Name>/` folder via TDD. This mirrors how v1 Phases 1–3 shipped.

**Every subagent MUST follow this brief (applies to all tasks):**

- Build ONLY your assigned `src/components/<Name>/` folder: `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`.
- Use TDD: write `<Name>.test.tsx` first, watch it fail, implement, watch it pass.
- Run ONLY your own test file: `npx vitest run src/components/<Name>/<Name>.test.tsx`. Do NOT run project-wide `typecheck`/`lint`/`build`/`test:e2e` (concurrent writes make them unreliable) and do NOT run any `git` command.
- Do NOT edit shared files: `src/index.ts`, `e2e/components.spec.ts`, `README.md`, `src/theme/tokens.ts`. If you believe a new token is genuinely needed, note it in your final report instead of editing `tokens.ts`.
- Follow `src/components/Button/Button.tsx` for structure: `forwardRef` wrapped in `/* @__PURE__ */`, `cx(styles.root, className)`, spread remaining DOM props to the root, data-attributes for variants.
- **DOM-prop collision rule (typecheck-only failure):** when your interface extends `HTMLAttributes`/`InputHTMLAttributes` and you declare a prop whose name collides with a DOM attribute of a different type, you MUST `Omit` it. Known collisions in this phase: `checked`, `defaultChecked`, `onChange`, `value`, `defaultValue`, `orientation`, `size`. See `TextField.tsx` for the pattern: `Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange'>`.
- **Controlled/uncontrolled pattern:** use `useControllableState<T>({ value, defaultValue, onChange: undefined })` (note `onChange: undefined` — the public `onChange(value, event)` is called manually after `setState`, exactly as `TextField.tsx` does). The hook's own `onChange` takes only `(value)`, so never pass the public handler into it.
- **Stories:** export a `Default` and a `Showcase` story. `Showcase` must exercise the widest spread of variants/sizes/states — it is the axe + visual-regression target. Follow `TextField.stories.tsx`.
- **A11y:** color is never the only signal. Honor `prefers-reduced-motion` for any animation. Aim for zero axe violations (the integration session will verify).
- When done, report: files created, `npx vitest run` result, and any token/integration notes for the parent session.

**Integration (parent session only, after all subagents finish):** wire `src/index.ts` exports + the e2e `COMPONENTS` array, run the FULL gate (`typecheck`, `lint`, `test`, `build`, `verify:bundle`, `test:e2e`), regenerate local visual baselines (gitignored — do NOT commit them), update the README status block, fix any DOM-prop-collision typecheck errors, and make per-component + integration commits.

---

## Task 1: Checkbox

**Files:**

- Create: `src/components/Checkbox/Checkbox.tsx`
- Create: `src/components/Checkbox/Checkbox.module.css`
- Create: `src/components/Checkbox/Checkbox.test.tsx`
- Create: `src/components/Checkbox/Checkbox.stories.tsx`
- Create: `src/components/Checkbox/index.ts`

**API contract:**

```tsx
export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'checked' | 'defaultChecked' | 'onChange'
> {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  /** Visually + a11y indeterminate; set on the DOM node via ref, not an attribute. */
  indeterminate?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  size?: CheckboxSize;
  error?: boolean;
}
```

- Renders a native `<input type="checkbox">` wrapped in a `<label>` so the click target includes the label text. Associate via wrapping `<label>` (no `htmlFor` needed) OR `useId` + `htmlFor` — prefer wrapping label for the visual swap pattern, using `useId` only if the label is rendered as a sibling.
- `indeterminate` must be applied to the DOM node imperatively: `useEffect(() => { if (inputRef.current) inputRef.current.indeterminate = !!indeterminate; })`. Merge the internal ref with the forwarded `ref` using `mergeRefs`.
- `aria-invalid={error || undefined}` on the input.
- Custom visual box is a sibling `<span aria-hidden>` styled via `data-*`; the real `<input>` is visually hidden but accessible (use the `VisuallyHidden`-style clip OR opacity:0 overlay — match how the repo hides native controls; opacity:0 absolutely-positioned input over the visual box is the standard accessible pattern).

- [ ] **Step 1: Write the failing tests** in `src/components/Checkbox/Checkbox.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders an accessible checkbox associated with its label', () => {
    render(<Checkbox label="Accept terms" />);
    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(box).toBeInTheDocument();
  });

  it('works uncontrolled with defaultChecked', async () => {
    render(<Checkbox label="A" defaultChecked />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.checked).toBe(true);
    await userEvent.click(box);
    expect(box.checked).toBe(false);
  });

  it('works controlled: respects checked and calls onChange with (checked, event)', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="A" checked={false} onChange={onChange} />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(box.checked).toBe(false); // controlled — unchanged without parent update
  });

  it('reflects indeterminate on the DOM node', () => {
    render(<Checkbox label="A" indeterminate />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
  });

  it('sets aria-invalid when error', () => {
    render(<Checkbox label="A" error />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards a ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox label="A" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run src/components/Checkbox/Checkbox.test.tsx`
Expected: FAIL ("Cannot find module './Checkbox'").

- [ ] **Step 3: Implement `Checkbox.tsx`, `Checkbox.module.css`, `index.ts`**

Follow the API contract above and the `Button`/`TextField` structure. `index.ts` exports: `export { Checkbox } from './Checkbox'; export type { CheckboxProps, CheckboxSize } from './Checkbox';`. CSS: `.root` is the wrapping label (inline-flex, gap, cursor pointer); `.input` is the visually-hidden native input; `.box` is the visual indicator with `data-checked` / `data-indeterminate` / `data-size` / `data-error` styling using `--ku-color-*` tokens; show a check/dash glyph (inline SVG or CSS) and a visible focus ring driven by `.input:focus-visible + .box`.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run src/components/Checkbox/Checkbox.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Write `Checkbox.stories.tsx`** with `Default` (`{ args: { label: 'Accept terms' } }`) and a `Showcase` rendering: unchecked, checked, indeterminate, disabled, error, and all three sizes.

- [ ] **Step 6: Re-run tests** to confirm still green, then report to parent (do NOT commit).

---

## Task 2: Radio + RadioGroup

**Files:**

- Create: `src/components/Radio/Radio.tsx`
- Create: `src/components/Radio/RadioGroup.tsx`
- Create: `src/components/Radio/Radio.module.css`
- Create: `src/components/Radio/Radio.test.tsx`
- Create: `src/components/Radio/Radio.stories.tsx`
- Create: `src/components/Radio/index.ts`

**API contract:**

```tsx
export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  name?: string; // defaults to a useId-generated name
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  orientation?: 'horizontal' | 'vertical'; // default 'vertical'
  label?: string; // group label; renders a <span> referenced by aria-labelledby OR a <fieldset><legend>
}

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: string;
  label?: ReactNode;
  disabled?: boolean;
}
```

- `RadioGroup` provides `{ name, value, onChange }` to descendant `Radio`s via a React context defined in `Radio.tsx` (or a small `radioGroupContext.ts` in the same folder — keep it in-folder). Root renders `role="radiogroup"` with `aria-orientation` and `aria-label`/`aria-labelledby`.
- Each `Radio` reads context; its `<input type="radio">` shares the group `name`, is `checked={ctx.value === value}`, and on change calls `ctx.onChange(value, event)`. Native arrow-key selection works automatically for same-`name` radios.
- Use `useControllableState<string>` inside `RadioGroup` for value, with the manual `onChange?.(value, event)` call.

- [ ] **Step 1: Write the failing tests** in `src/components/Radio/Radio.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, Radio } from './';

function Group(props: { value?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <RadioGroup label="Plan" {...props}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
    </RadioGroup>
  );
}

describe('RadioGroup / Radio', () => {
  it('exposes a radiogroup with named radios', () => {
    render(<Group />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<Group defaultValue="free" />);
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });

  it('works controlled and calls onChange with the selected value', async () => {
    const onChange = vi.fn();
    render(<Group value="free" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(onChange).toHaveBeenCalledWith('pro', expect.anything());
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked(); // controlled
  });

  it('shares a single name across radios', () => {
    render(<Group />);
    const [a, b] = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(a.name).toBe(b.name);
    expect(a.name).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail.** Run: `npx vitest run src/components/Radio/Radio.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implement** `Radio.tsx` (context + `Radio`), `RadioGroup.tsx`, `Radio.module.css`, `index.ts`. `index.ts`: `export { Radio } from './Radio'; export { RadioGroup } from './RadioGroup'; export type { RadioProps } from './Radio'; export type { RadioGroupProps } from './RadioGroup';`. CSS mirrors Checkbox but the visual indicator is a circle with an inner dot on `data-checked`.

- [ ] **Step 4: Run the tests, verify they pass.** Run: `npx vitest run src/components/Radio/Radio.test.tsx` — Expected: PASS (4 tests).

- [ ] **Step 5: Write `Radio.stories.tsx`** — `Default` (a vertical group) and `Showcase` (vertical + horizontal groups, a disabled option, preselected value).

- [ ] **Step 6: Re-run tests, report to parent (do NOT commit).**

---

## Task 3: Switch

**Files:**

- Create: `src/components/Switch/Switch.tsx`, `Switch.module.css`, `Switch.test.tsx`, `Switch.stories.tsx`, `index.ts`

**API contract:**

```tsx
export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'checked' | 'defaultChecked' | 'onChange' | 'type'
> {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  size?: SwitchSize;
}
```

- Native `<input type="checkbox" role="switch">` (set `role="switch"` on the input) visually hidden over a track+thumb. `aria-checked` is implied by the checkbox's checked state when `role="switch"`. The thumb position (data-checked) is a non-color signal.

- [ ] **Step 1: Write the failing tests** in `src/components/Switch/Switch.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a switch role with its label', () => {
    render(<Switch label="Wi-Fi" />);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
  });

  it('toggles when uncontrolled', async () => {
    render(<Switch label="Wi-Fi" defaultChecked={false} />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    await userEvent.click(sw);
    expect(sw.checked).toBe(true);
  });

  it('controlled: calls onChange with (checked, event), stays fixed without parent update', async () => {
    const onChange = vi.fn();
    render(<Switch label="Wi-Fi" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(sw.checked).toBe(false);
  });

  it('forwards a ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Switch label="X" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Switch/Switch.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Switch } from './Switch'; export type { SwitchProps, SwitchSize } from './Switch';`. CSS: `.track` with `data-checked` background swap + `.thumb` translateX transition (guarded by `prefers-reduced-motion`).
- [ ] **Step 4: Run, verify pass (4 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (off, on, disabled, all sizes).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 4: Spinner

**Files:**

- Create: `src/components/Spinner/Spinner.tsx`, `Spinner.module.css`, `Spinner.test.tsx`, `Spinner.stories.tsx`, `index.ts`

**API contract:**

```tsx
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerTone = 'primary' | 'neutral';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role'> {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  /** Accessible label. When provided, role="status" + visually-hidden text. When omitted, the spinner is aria-hidden (decorative). */
  label?: string;
}
```

- Pure presentational. Decorative by default (`aria-hidden`). When `label` is given, root is `role="status"` containing a `VisuallyHidden` label so screen readers announce it.
- Spin animation must be disabled under `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 1: Write the failing tests** in `src/components/Spinner/Spinner.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is decorative (aria-hidden) without a label', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes role=status and an accessible label when label is given', () => {
    render(<Spinner label="Loading" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
  });

  it('reflects size and tone as data attributes', () => {
    const { container } = render(<Spinner size="lg" tone="neutral" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-tone', 'neutral');
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Spinner/Spinner.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Spinner } from './Spinner'; export type { SpinnerProps, SpinnerSize, SpinnerTone } from './Spinner';`. Use an inline SVG circle or a CSS border-spinner with `@keyframes spin`; gate animation on reduced-motion.
- [ ] **Step 4: Run, verify pass (3 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (all sizes × both tones, plus one with a label).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 5: Skeleton

**Files:**

- Create: `src/components/Skeleton/Skeleton.tsx`, `Skeleton.module.css`, `Skeleton.test.tsx`, `Skeleton.stories.tsx`, `index.ts`

**API contract:**

```tsx
export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant; // default 'text'
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'none'; // default 'pulse'
}
```

- Decorative placeholder: root is `aria-hidden`. Apply `width`/`height` via inline `style` (numbers → px). `data-variant` controls border-radius (text: small, circle: 50%). Shimmer/pulse disabled under `prefers-reduced-motion`.

- [ ] **Step 1: Write the failing tests** in `src/components/Skeleton/Skeleton.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is decorative (aria-hidden)', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies width/height as inline styles (numbers → px)', () => {
    const { container } = render(<Skeleton width={120} height="2rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('2rem');
  });

  it('reflects variant as a data attribute', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstChild).toHaveAttribute('data-variant', 'circle');
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Skeleton/Skeleton.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Skeleton } from './Skeleton'; export type { SkeletonProps, SkeletonVariant } from './Skeleton';`.
- [ ] **Step 4: Run, verify pass (3 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (text lines, rect, circle; a composed "card skeleton").
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 6: Divider

**Files:**

- Create: `src/components/Divider/Divider.tsx`, `Divider.module.css`, `Divider.test.tsx`, `Divider.stories.tsx`, `index.ts`

**API contract:**

```tsx
export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
  /** Optional centered label (horizontal only). When present, the divider is decorative (role="presentation"). */
  children?: ReactNode;
  inset?: boolean;
}
```

- No children → `role="separator"` + `aria-orientation`. With children (label) → `role="presentation"` and render two rules around the label.

- [ ] **Step 1: Write the failing tests** in `src/components/Divider/Divider.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('is a separator with orientation by default', () => {
    render(<Divider orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders a label and becomes presentational', () => {
    const { container } = render(<Divider>OR</Divider>);
    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(container.querySelector('[role="separator"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Divider/Divider.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Divider } from './Divider'; export type { DividerProps } from './Divider';`.
- [ ] **Step 4: Run, verify pass (2 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (horizontal, vertical between items, with a label).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 7: Accordion

**Files:**

- Create: `src/components/Accordion/Accordion.tsx`, `Accordion.module.css`, `Accordion.test.tsx`, `Accordion.stories.tsx`, `index.ts`

**API contract (items-based, to keep the surface small and parallel-safe):**

```tsx
export interface AccordionItemData {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  items: AccordionItemData[];
  /** Expanded item id(s). string for single-mode, string[] for multiple. */
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean; // default false
  collapsible?: boolean; // single-mode: allow closing the open item. default true
}
```

- Each item: header `<button aria-expanded aria-controls={panelId} id={headerId}>`; panel `<div role="region" aria-labelledby={headerId} id={panelId} hidden={!expanded}>`. Use `useId` per item for the id pair.
- State via `useControllableState`. In single mode, value is a string (or ''); in multiple mode, an array. Toggling updates accordingly and calls `onChange`.

- [ ] **Step 1: Write the failing tests** in `src/components/Accordion/Accordion.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: 'Section A', content: 'Body A' },
  { id: 'b', title: 'Section B', content: 'Body B' },
];

describe('Accordion', () => {
  it('renders headers as buttons with aria-expanded', () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    expect(a).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a panel on click and links it via aria-controls/labelledby', async () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    await userEvent.click(a);
    expect(a).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Section A' });
    expect(region).toHaveTextContent('Body A');
  });

  it('single mode collapses the previously open item', async () => {
    render(<Accordion items={items} defaultValue="a" />);
    await userEvent.click(screen.getByRole('button', { name: 'Section B' }));
    expect(screen.getByRole('button', { name: 'Section A' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Section B' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('multiple mode keeps several open and reports an array to onChange', async () => {
    const onChange = vi.fn();
    render(<Accordion items={items} multiple onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Section B' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Accordion/Accordion.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Accordion } from './Accordion'; export type { AccordionProps, AccordionItemData } from './Accordion';`. Chevron icon rotates on `data-expanded`; height transition gated by reduced-motion (or simple `hidden` toggle — keep it robust).
- [ ] **Step 4: Run, verify pass (4 tests).**
- [ ] **Step 5: Stories** — `Default` (single) and `Showcase` (single collapsible + multiple, a disabled item).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 8: Breadcrumbs

**Files:**

- Create: `src/components/Breadcrumbs/Breadcrumbs.tsx`, `Breadcrumbs.module.css`, `Breadcrumbs.test.tsx`, `Breadcrumbs.stories.tsx`, `index.ts`

**API contract:**

```tsx
export interface BreadcrumbItem {
  label: ReactNode;
  href?: string; // last item typically has no href (current page)
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Separator between items. Defaults to a chevron icon. */
  separator?: ReactNode;
  /** Collapse middle items when more than this many. */
  maxItems?: number;
}
```

- Root `<nav aria-label="Breadcrumb">` → `<ol>` → `<li>`. Items with `href` render `<a>`; the last item (or any without `href`) renders a `<span aria-current="page">`. Separators are `aria-hidden` and not part of the list semantics (render inside `<li>` or as decorative `<li aria-hidden>`).
- `maxItems` collapse: render first, an ellipsis `<li>`, and the last `(maxItems-2)` items.

- [ ] **Step 1: Write the failing tests** in `src/components/Breadcrumbs/Breadcrumbs.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Data', href: '/library/data' },
  { label: 'Current' },
];

describe('Breadcrumbs', () => {
  it('renders a labeled nav landmark', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders links for items with href and marks the last as current', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('collapses middle items when over maxItems', () => {
    render(<Breadcrumbs items={items} maxItems={3} />);
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Library' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Breadcrumbs/Breadcrumbs.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Breadcrumbs } from './Breadcrumbs'; export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs';`. Use the existing chevron icon from `../../icons` as the default separator. Use `…` (U+2026) for the ellipsis text so the test matches.
- [ ] **Step 4: Run, verify pass (3 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (short trail, custom separator, collapsed with maxItems).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Task 9: Tabs

**Files:**

- Create: `src/components/Tabs/Tabs.tsx`, `Tabs.module.css`, `Tabs.test.tsx`, `Tabs.stories.tsx`, `index.ts`

**API contract (items-based for parallel-safety and simple keyboard logic):**

```tsx
export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  items: TabItem[];
  value?: string;
  defaultValue?: string; // defaults to first non-disabled item
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
}
```

- `<div role="tablist" aria-orientation>` containing `<button role="tab" id={tabId} aria-selected aria-controls={panelId} tabIndex={selected ? 0 : -1}>` (roving tabindex). Panels: `<div role="tabpanel" id={panelId} aria-labelledby={tabId} hidden={!selected} tabIndex={0}>`.
- Keyboard: ArrowRight/Left (horizontal) or ArrowDown/Up (vertical) move selection across non-disabled tabs, Home/End jump to first/last. Selecting via keyboard moves focus and activates (automatic activation). Use `useId` for id pairs and `useControllableState` for value.

- [ ] **Step 1: Write the failing tests** in `src/components/Tabs/Tabs.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const items = [
  { id: 'one', label: 'One', content: 'Panel One' },
  { id: 'two', label: 'Two', content: 'Panel Two' },
  { id: 'three', label: 'Three', content: 'Panel Three' },
];

describe('Tabs', () => {
  it('renders a tablist and selects the first tab by default', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'One' })).toHaveTextContent('Panel One');
  });

  it('activates a tab on click and links the panel', async () => {
    render(<Tabs items={items} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toHaveTextContent('Panel Two');
  });

  it('moves selection with arrow keys (roving tabindex)', async () => {
    render(<Tabs items={items} />);
    const first = screen.getByRole('tab', { name: 'One' });
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled: respects value and calls onChange', async () => {
    const onChange = vi.fn();
    render(<Tabs items={items} value="one" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true'); // controlled
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Tabs/Tabs.test.tsx`
- [ ] **Step 3: Implement.** `index.ts`: `export { Tabs } from './Tabs'; export type { TabsProps, TabItem } from './Tabs';`. Active-tab underline/indicator via `data-selected`; transitions gated by reduced-motion.
- [ ] **Step 4: Run, verify pass (4 tests).**
- [ ] **Step 5: Stories** — `Default` and `Showcase` (horizontal + vertical, a disabled tab).
- [ ] **Step 6: Re-run, report (no commit).**

---

## Integration Task (parent session, after all 9 subagents report)

- [ ] **Step 1: Add exports to `src/index.ts`** (after the existing `Sidebar` exports):

```ts
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps, CheckboxSize } from './components/Checkbox';
export { Radio, RadioGroup } from './components/Radio';
export type { RadioProps, RadioGroupProps } from './components/Radio';
export { Switch } from './components/Switch';
export type { SwitchProps, SwitchSize } from './components/Switch';
export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerTone } from './components/Spinner';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './components/Skeleton';
export { Divider } from './components/Divider';
export type { DividerProps } from './components/Divider';
export { Accordion } from './components/Accordion';
export type { AccordionProps, AccordionItemData } from './components/Accordion';
export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/Breadcrumbs';
export { Tabs } from './components/Tabs';
export type { TabsProps, TabItem } from './components/Tabs';
```

- [ ] **Step 2: Add the 9 components to the e2e `COMPONENTS` array** in `e2e/components.spec.ts` using their Showcase story ids (`components-checkbox--showcase`, `components-radio--showcase`, `components-switch--showcase`, `components-spinner--showcase`, `components-skeleton--showcase`, `components-divider--showcase`, `components-accordion--showcase`, `components-breadcrumbs--showcase`, `components-tabs--showcase`).

- [ ] **Step 3: Run the full gate.**

```bash
npm run typecheck   # fix any DOM-prop-collision Omit errors here
npm run lint
npm test
npm run build
npm run verify:bundle
npm run test:e2e    # regenerate visual baselines locally; do NOT commit *-snapshots/
```

Expected: all green; 9 new components × 2 themes pass axe with zero violations. Fix real contrast failures in the component CSS, never by disabling axe rules.

- [ ] **Step 4: Update the README status block** to reflect the 9 new components.

- [ ] **Step 5: Commit** per-component, then an integration commit wiring exports + e2e, on the `phase-5-6-component-expansion` branch.

---

## Self-Review notes (already applied)

- Spec coverage: all 9 Phase-5 components in spec §4 have a task. Controlled/uncontrolled (§5) covered by the `useControllableState` instruction + per-component controlled tests. A11y (§6) covered by role/aria assertions + the integration axe gate. DOM-prop `Omit` (§5) is in the shared brief and every interface uses it.
- No placeholders: every task has concrete API types, real test code, exact `index.ts` exports, and exact verification commands.
- Type consistency: export names in the Integration Task match each task's `index.ts` exactly.
