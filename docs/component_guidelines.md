# Component Guidelines

> **Document Owner:** Founder
> **Last Updated:** May 25, 2026
> **Status:** Living Document

---

## Overview

Koduh AI components are **built from scratch** — they own their markup, styling,
behavior, and accessibility. They are **not** wrappers around a third-party
library, and there is no hidden vendor component to pass props through to. Each component renders native
HTML, styles itself with CSS Modules driven by `--ku-*` design tokens, and exposes
a small, explicit, fully-typed prop interface.

`src/components/Button/` is the **reference implementation**. When in doubt about a
pattern, look there first; the conventions below are all demonstrated by it.

---

## Design Philosophy

| Principle                        | What It Means                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Own the markup**               | Render native elements (`<button>`, `<header>`, `<nav>`) directly. No wrapped vendor component.                      |
| **Tokens, never hardcode**       | All colors, spacing, radii, type, etc. reference `--ku-*` CSS variables. Never hardcode a hex value or pixel size.   |
| **Zero-runtime styling**         | Styles live in a co-located `*.module.css`. No CSS-in-JS, no runtime style serialization.                            |
| **Variants via data-attributes** | The root element carries `data-variant`, `data-tone`, `data-size`, etc.; the CSS selects on them.                    |
| **Explicit, typed props**        | Props are named and typed. Standard DOM attributes pass through to the root; we never forward an unbounded prop set. |
| **Consistent vocabulary**        | `variant` + `tone`, with `solid`/`outline`/`ghost` styles shared across every tonal component.                       |
| **Accessibility built in**       | Correct semantics, keyboard support, visible focus, WCAG AA contrast in both themes — verified by tests.             |

---

## Component Set

The library has grown well past its original scope; **`src/index.ts` is the
authoritative list** of what's shipped (69 components as of v2.5.0), spanning
actions, forms, overlays, navigation, feedback, layout/typography, data display,
data-viz, and date inputs. `Button` remains the **reference implementation** for
the patterns below. (Earlier revisions of this doc listed a 12-component scope and
flagged `Dialog`/`Snackbar`/`DataTable` as "removed" — that is obsolete; all three
shipped, built on platform primitives rather than portals/focus-traps.)

`Button`'s own API for reference: `variant` (`solid`/`outline`/`ghost`),
`tone` (the shared `primary`/`neutral`/`success`/`warning`/`danger` set), `size`
(`sm`/`md`/`lg`), `asChild`, `startIcon`, `endIcon`, `fullWidth`.

---

## Component Structure

Each component is a self-contained folder:

```
src/components/Button/
├── Button.tsx           # Implementation (forwardRef, data-attrs, cx)
├── Button.module.css    # Scoped styles, --ku-* tokens, data-attr selectors
├── Button.test.tsx      # Vitest + Testing Library unit tests
├── Button.stories.tsx   # Storybook stories (incl. a Showcase)
└── index.ts             # Barrel export of component + its prop types
```

Every public prop type is exported from the component's `index.ts` and re-exported
from `src/index.ts` (e.g. `ButtonProps`, `ButtonVariant`, `ButtonTone`,
`ButtonSize`).

---

## Worked Example: Button

### The `.tsx`

```tsx
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; // defaults to 'solid'
  tone?: ButtonTone; // defaults to 'primary'
  size?: ButtonSize; // defaults to 'md'
  fullWidth?: boolean;
  startIcon?: ReactNode; // any ReactNode — not forced to our icon set
  endIcon?: ReactNode;
  asChild?: boolean; // render the child element instead of <button>
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

### The `.module.css`

```css
.root {
  display: inline-flex;
  align-items: center;
  gap: var(--ku-space-2);
  font-family: var(--ku-font-family-base);
  font-weight: var(--ku-font-weight-semibold);
  border-radius: var(--ku-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color var(--ku-duration-fast) var(--ku-easing-standard);
}

/* tone sets local CSS vars that the variant rules consume */
.root[data-tone='primary'] {
  --btn-main: var(--ku-color-primary);
  --btn-contrast: var(--ku-color-primary-contrast);
}
.root[data-tone='danger'] {
  --btn-main: var(--ku-color-danger);
  --btn-contrast: var(--ku-color-bg-default);
}

/* variant uses the tone vars — each rule stays small */
.root[data-variant='solid'] {
  background-color: var(--btn-main);
  color: var(--btn-contrast);
}
.root[data-variant='outline'] {
  background-color: transparent;
  color: var(--btn-main);
  border-color: var(--btn-main);
}

.root[data-size='md'] {
  min-height: 40px;
  padding: var(--ku-space-2) var(--ku-space-4);
  font-size: var(--ku-font-size-md);
}
```

---

## The Established Patterns

### 1. Variant styling via data-attributes (not class composition)

Components set semantic `data-*` attributes on the root element. The
`.module.css` selects on them (`.root[data-variant='solid']`). A small set of
**CSS-local custom properties** (e.g. `--btn-main`, `--btn-contrast`) bridges
`tone` → `variant`, so each variant rule stays tiny and the tone choice is
factored out once. This keeps the TSX free of conditional class strings.

### 2. `cx` for class merging

`cx(styles.root, className)` merges the scoped module class with a
consumer-passed `className`. The consumer's `className` is **always** forwarded to
the root. `cx` is a zero-dependency `clsx`-lite (`src/utils/cx.ts`) — drop falsy
values, join with spaces.

### 3. `forwardRef` + DOM prop passthrough

Every component uses `forwardRef` and spreads the remaining props (`...props`)
onto the root element, so `aria-*`, `data-*`, `id`, `onClick`, etc. pass through.
Props are **explicit and typed** — extend the appropriate
`*HTMLAttributes<Element>` interface (e.g. `ButtonHTMLAttributes<HTMLButtonElement>`).
There is no opaque passthrough to a hidden vendor component.

### 4. `asChild` / Slot polymorphism (not `as` / `component`)

For polymorphism, use the `Slot` primitive via an `asChild` prop instead of an
`as`/`component` prop. When `asChild` is set, the component merges its
`className`, `data-*`, event handlers, and ref onto the single child element
rather than rendering its own DOM node. This lets `Button` render as an `<a>`, a
router `<Link>`, a `mailto:`, etc., while keeping the correct role:

```tsx
<Button asChild tone="danger">
  <a href="/contact">Contact</a>
</Button>
```

Slot merges via `composeEventHandlers` (handlers) and `mergeRefs` (refs) under the
hood.

### 5. Controlled / uncontrolled symmetry

Stateful components use the `useControllableState` primitive so they support both
a controlled `value` and an uncontrolled `defaultValue` behind a single `onChange`
contract:

```tsx
const [value, setValue] = useControllableState({ value, defaultValue, onChange });
```

(Used by `TextField` and `Chip` selection in later phases.)

### 6. Icons accept any `ReactNode`

Every icon-accepting prop (`startIcon`, `endIcon`, `Alert` icon, `Chip`/`Avatar`
icon, etc.) is typed as `ReactNode`. Consumers may pass our vendored icons, their
own SVGs, or another library's icons. The decorative icon wrapper gets
`aria-hidden`. See [Icon Guidelines](icon_guidelines.md).

### 7. Composing other components

A component may compose another (e.g. `LoadingButton` renders `Button`, adding
`loading`/`loadingText`, setting `aria-busy`, disabling interaction, and using
`VisuallyHidden` for the loading announcement). It still does **not** reach into
that component's internals — it only uses the public props.

### 8. Collection controls: array-driven vs `children`

Components that render a collection split by **what each item needs**, not by
preference:

- **Array-driven** (`options` / `items` / `entries` props) when items are plain
  data the component fully owns the markup for: `Select` (`options`), `Tabs`
  (`items`), `Menu` (`entries`), `Breadcrumbs` (`items`). The component controls
  roles, ids, `aria-activedescendant`, and keyboard navigation across the set, so
  data-in keeps consumers out of the a11y wiring.
- **`children`** when each item is itself an interactive, individually-labelable
  control the consumer composes and may need a ref to: `RadioGroup` wraps
  `<Radio>` children (each is a real focusable `<input>` with its own label).

Rule of thumb: if correct ARIA depends on the component orchestrating the whole
set, take an array; if each item is a standalone control the consumer owns, take
`children`.

### 9. Consistent overlay open/close API

Components with an `open` prop (`Dialog`, `ConfirmDialog`, `Snackbar`, `Popover`,
`Select`) report close/visibility through **`onOpenChange(open: boolean)`** —
called with `false` when the overlay requests to close. (`Alert` is **not** in
this group: it has no `open` prop and is a fire-and-forget inline dismiss, so it
keeps `onClose`.) Overlay body content is passed as `children`, not a `message`
prop.

---

## API Vocabulary

The API is designed for clarity and consistency across the library:

| Concept          | Convention                                               |
| ---------------- | -------------------------------------------------------- |
| Visual style     | `variant`: `solid`/`outline`/`ghost`                     |
| Semantic color   | `tone`: `primary`/`neutral`/`success`/`warning`/`danger` |
| Overlay close    | `onOpenChange(open)` (with an `open` prop)               |
| Polymorphism     | `asChild` (Slot)                                         |
| Stateful value   | `value` + `defaultValue` + `onChange`                    |
| Styling override | `className` + tokens / CSS Modules                       |

---

## Naming Conventions

| Element         | Convention           | Example                                     |
| --------------- | -------------------- | ------------------------------------------- |
| Component file  | PascalCase           | `Button.tsx`                                |
| Styles file     | `{Name}.module.css`  | `Button.module.css`                         |
| Props interface | `{Name}Props`        | `ButtonProps`                               |
| Variant types   | `{Name}{Axis}`       | `ButtonVariant`, `ButtonTone`, `ButtonSize` |
| Test file       | `{Name}.test.tsx`    | `Button.test.tsx`                           |
| Story file      | `{Name}.stories.tsx` | `Button.stories.tsx`                        |
| Barrel export   | `index.ts`           | —                                           |
| Package export  | Named exports        | `export { Button }`                         |

---

## Accessibility Expectations

Every component must, in **both** dark and light themes:

- Use **correct native elements / ARIA roles** (e.g. `Button` is a native
  `<button>`; an icon-only affordance gets a label; `Alert` uses
  `role="alert"`/`role="status"` per severity).
- Be **keyboard reachable and operable** with a visible `:focus-visible` ring.
- Meet **WCAG AA contrast** (4.5:1 text, 3:1 large text / UI boundaries).
- **Never use color as the only signal** (e.g. `StatusBadge` always shows a text
  label).
- Honor `prefers-reduced-motion` (handled centrally in `reset.css`; transitions
  are plain CSS).

---

## Testing Expectations

Each component ships with co-located `*.test.tsx`. Tests cover behavior, props,
data-attribute reflection, controlled/uncontrolled where applicable, event
callbacks, `asChild`/ref forwarding, and edge cases. The Button test suite is the
template — note it needs **no** `ThemeProvider` wrapper (styling is CSS, not a
React theme object):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

it('defaults to solid/primary/md and reflects overrides as data attributes', () => {
  render(<Button>X</Button>);
  const btn = screen.getByRole('button');
  expect(btn).toHaveAttribute('data-variant', 'solid');
  expect(btn).toHaveAttribute('data-tone', 'primary');
});

it('renders as the child element when asChild is set, merging props', () => {
  render(
    <Button asChild tone="danger">
      <a href="/contact">Contact</a>
    </Button>,
  );
  const link = screen.getByRole('link', { name: 'Contact' });
  expect(link).toHaveAttribute('data-tone', 'danger');
});
```

Three layers gate a merge: Vitest + Testing Library (behavior), `tsc --noEmit`
(types), and Playwright + axe-core (a11y/visual against stories in both themes,
zero violations).

---

## Story Expectations

Each component has a `*.stories.tsx` with a `Default` story and a `Showcase` story
that exercises the widest spread of variants/tones/sizes. The `Showcase` is the
target the e2e suite drives for a11y and visual-regression checks in both themes.
See [Storybook Guide](storybook_guide.md).

---

_This is a living document. Update it as components are added._
