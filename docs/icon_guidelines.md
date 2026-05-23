# Icon Guidelines

> **Document Owner:** Founder
> **Last Updated:** May 22, 2026
> **Status:** Living Document

---

## Overview

The design system ships a **small, vendored, in-house SVG icon set**. It does
**not** depend on `@mui/icons-material` (or any icon library). Each icon is a
standalone React component that renders an inline `<svg>` using `currentColor`, so
it inherits the surrounding text color and is styled with the same `--ku-*` tokens
as everything else.

The set is intentionally minimal — sized to cover what the 12 components and
common app usage need. It is **not** a general-purpose icon library and will grow
only as concrete needs arise (YAGNI).

> Crucially, the system **never forces our icons on consumers.** Every component
> prop that accepts an icon takes any `ReactNode` (see "Icons in Components"
> below), so consumers may pass our icons, their own SVGs, or another library's
> icons.

---

## Icon Source & Entry Point

| Aspect       | Detail                                               |
| ------------ | ---------------------------------------------------- |
| Source       | Hand-authored SVG path data in `src/icons/icons.tsx` |
| Factory      | `createIcon` in `src/icons/createIcon.tsx`           |
| Entry point  | `@koduhai/design-system/icons`                       |
| Tree-shaking | Each icon is an individual named export              |

```
src/icons/
├── createIcon.tsx   # the icon factory + IconProps
├── icons.tsx        # the vendored set (one createIcon call per icon)
└── index.ts         # re-exports createIcon, IconProps, and every icon
```

### Current set

`CloseIcon`, `ChevronDownIcon`, `CheckIcon`, `InfoIcon`, `WarningIcon`,
`ErrorIcon`, `MenuIcon`, `SearchIcon`, `UserIcon`.

All export with the `{Name}Icon` suffix so they never collide with component or
local variable names.

---

## The `createIcon` Factory

Every icon is built by `createIcon(displayName, path)`, where `path` is the raw
`<path>` (or other SVG child) content. The factory produces a `forwardRef`
component with a consistent, accessible shape:

```tsx
import { createIcon } from '@koduhai/design-system/icons';

export const CheckIcon = createIcon(
  'CheckIcon',
  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
);
```

The factory renders:

```tsx
<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden={labelled ? undefined : true}
  role={labelled ? 'img' : undefined}
  {...props}
>
  {labelled ? <title>{title}</title> : null}
  {path}
</svg>
```

Authoring rules for new icons: a `24 × 24` viewBox, single path where possible,
and `fill="currentColor"` (handled by the factory — don't bake colors into the
path data).

---

## `IconProps`

```ts
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Width/height in px (icons are square). Defaults to 24. */
  size?: number | string;
  /** Accessible label. When set, the icon is exposed as an image with this name. */
  title?: string;
}
```

- All remaining standard SVG props pass through to the `<svg>` (e.g. `className`,
  `style`, `onClick`, `data-*`, `aria-*`).
- A `ref` forwards to the `<svg>` element.

### Sizing

Icons are square; control size with the `size` prop (default `24`). Pass a number
(px) or any CSS length string:

```tsx
<CheckIcon size={20} />
<CheckIcon size="1.5rem" />
```

There is no MUI-style `fontSize="small|medium|large"` prop — `size` is the single,
explicit knob.

### Color

Icons use `currentColor`, so they inherit the color of their context. To recolor,
set `color` on the icon (or an ancestor), preferably from a token:

```tsx
<ErrorIcon style={{ color: 'var(--ku-color-danger)' }} />
<InfoIcon style={{ color: 'var(--ku-color-info)' }} />
```

Never hardcode a hex value — use `--ku-color-*` tokens. There is no `sx` prop.

---

## Accessibility: Decorative by Default

Icons are **decorative by default**. With no `title`, the factory sets
`aria-hidden="true"` and renders no `role`, so screen readers skip the icon — the
correct behavior when an adjacent text label already conveys meaning.

When an icon **is** the meaning (e.g. an icon-only button, a standalone status
glyph), pass `title`. The factory then drops `aria-hidden`, adds `role="img"`, and
renders a `<title>` element exposing the accessible name:

```tsx
// Decorative — paired with visible text:
<Button startIcon={<SearchIcon />}>Search</Button>

// Meaningful — icon stands alone:
<button aria-label="Close"><CloseIcon /></button>
<CheckIcon title="Completed" />
```

For icon-only affordances you can either label the wrapping control
(`aria-label="Close"`) or give the icon a `title`. Pick one — don't double-label.

---

## Icons in Components

Components that accept an icon type the prop as **`ReactNode`**, never as our icon
type. This is a deliberate clean-break rule: the system surfaces a convenient set
but never requires it.

```tsx
import { Button } from '@koduhai/design-system';
import { SearchIcon } from '@koduhai/design-system/icons';

// our icon
<Button startIcon={<SearchIcon />}>Search</Button>

// a consumer's own SVG — equally valid
<Button startIcon={<MyBrandGlyph />}>Search</Button>
```

Inside a component, a decorative icon slot is wrapped and marked `aria-hidden`
(see `Button`'s `startIcon`/`endIcon` rendering). Icon-accepting props include
`Button`/`LoadingButton` `startIcon`/`endIcon`, `Alert` `icon`, and `Chip` /
`Avatar` `icon`.

---

## Adding an Icon

1. Add a `createIcon(displayName, <path … />)` entry to `src/icons/icons.tsx`
   (24×24 viewBox, `currentColor`, no embedded styles).
2. Confirm it is picked up by the `export *` in `src/icons/index.ts`.
3. Add it to the **Foundations/Icons** gallery story (`src/icons/Icons.stories.tsx`)
   so it's documented and covered by the axe e2e check.

Only add icons that a real component or app need requires.

---

_This is a living document. Update it as the icon set grows._
