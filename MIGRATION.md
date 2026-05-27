# What's new in v2.2 (additive — issues #17/#18/#19)

All additive; no migration required. Highlights:

- **`FormField` now composes with the shipped controls** (#17). `TextField`,
  `Textarea`, `Select`, `NumberField`, `Combobox`, and `TagInput` detect an
  ancestor `<FormField>` and defer their label / required `*` / `aria-*` to it —
  so `<FormField label="Email" error errorText="…"><TextField/></FormField>`
  renders one correctly-associated label. Standalone usage is unchanged. `label`
  is now optional on `TextField`/`Textarea`/`NumberField` (supply it, or wrap in a
  `FormField`). A non-throwing `useOptionalFieldContext()` is exported for custom
  controls.
- **Combobox `clearable`** + open prop interface (`onBlur`/`onFocus`/`name`/`data-*`
  reach the input); **TagInput** open interface + `onChange(tags, event?)`;
  **Slider** open interface + `onChange(value, event?)` + `error`/`helperText`/
  `errorText`. `NumberField.onChange` still reports `null` when the field is empty
  (documented).
- **Toast** (#18): `toast.promise(p, { loading, success, error })`; caller-supplied
  stable `id` on `ToastOptions` (re-using an id **updates** that toast in place —
  enables "Saving… → Saved" and dedupe); per-toast `placement` + multiple
  `<Toaster>`s (an unplaced toast still shows in any Toaster). Tip: when migrating
  from Snackbar, alias the hook to avoid a local-state name clash:
  `const { toast: showToast } = useToast()`.
- **Layout/typography** (#19): responsive props on `Grid`/`Stack`/`Inline`
  (`columns={{ base: 1, md: 2 }}`, `gap={{ base: 3, md: 5 }}`, `Grid`
  `columns={[1.1, 1]}` track ratios); `Text`/`Heading` `leading`; `Text`
  `family`/`numeric`/`transform`/`truncate`/`lineClamp`; `Stack`/`Inline`
  `align="baseline"` + `as`; `Container` `py`; and two new components — **`Box`**
  (curated layout escape hatch: `padding`/`px`/`py`/`grow`/`shrink`/`minWidth`/`width`)
  and **`DescriptionList`** (`<dl>` key-value primitive).

---

# Migration Guide: v1 → v2

v2 is a small breaking release (the rest of v2 is additive). It harmonizes the
overlay open/close API across components. Two mechanical changes:

### 1. Overlay `onClose` → `onOpenChange(open)`

`Dialog`, `ConfirmDialog`, and `Snackbar` now report closing through
`onOpenChange(open: boolean)` (matching `Popover` and `Select`) instead of
`onClose()`. The callback fires with `false` when the overlay requests to close,
so a `useState` setter can be passed directly.

```tsx
// v1
<Dialog open={open} onClose={() => setOpen(false)} title="Edit">…</Dialog>
<Snackbar open={open} onClose={() => setOpen(false)} message="Saved" />
<ConfirmDialog open={open} onClose={close} onConfirm={remove} title="Delete?" />

// v2
<Dialog open={open} onOpenChange={setOpen} title="Edit">…</Dialog>
<Snackbar open={open} onOpenChange={setOpen}>Saved</Snackbar>
<ConfirmDialog open={open} onOpenChange={setOpen} onConfirm={remove} title="Delete?" />
```

> **`Alert` is unchanged.** It has no `open` prop — it's a fire-and-forget inline
> dismiss — so it still uses `onClose`.

### 2. `Snackbar` message → `children`

`Snackbar`'s `message` prop is gone; pass the content as `children` (matching
`Dialog`):

```tsx
// v1
<Snackbar open onClose={close} message="Changes saved" />
// v2
<Snackbar open onOpenChange={close}>Changes saved</Snackbar>
```

### 3. Renamed colour tokens (silent CSS breakage)

v2 harmonized the colour-token names. Because consuming CSS references a custom
property **with no fallback** — `border: 1px solid var(--ku-color-border-default)`
— a renamed token makes the whole declaration invalid and it silently renders as
nothing (transparent borders, missing panel backgrounds): no error, no warning.

| v1 token                    | v2 token                  |
| --------------------------- | ------------------------- |
| `--ku-color-bg-subtle`      | `--ku-color-bg-surface`   |
| `--ku-color-border-default` | `--ku-color-border`       |
| `--ku-color-fg-default`     | `--ku-color-text-primary` |

```css
/* before (v1) */
.panel {
  background: var(--ku-color-bg-subtle);
  border: 1px solid var(--ku-color-border-default);
  color: var(--ku-color-fg-default);
}
/* after (v2) */
.panel {
  background: var(--ku-color-bg-surface);
  border: 1px solid var(--ku-color-border);
  color: var(--ku-color-text-primary);
}
```

> **Back-compat aliases ship in `theme.css`.** The old names are now
> emitted as deprecated aliases that delegate to the replacement
> (`--ku-color-border-default: var(--ku-color-border)`), so existing consumer
> CSS keeps working without an immediate sweep. They are **deprecated and will
> be removed in the next major** — migrate to the replacement tokens above. Tip:
> `grep -rE 'ku-color-(bg-subtle|border-default|fg-default)'` to find references.

Everything else in v2 is **additive** and needs no migration: new `success`/
`warning` tones on `Chip`/`Button`, `--ku-color-*-fg` status text tokens, the
`Select` `clearable` prop, the expanded icon set, and the `dist/styles.css`
filename (the `@koduhai/design-system/styles.css` import specifier is unchanged).

### 4. v2 follow-up layer (additive — issues #9–#15)

New components and hooks; all additive. Highlights:

- **Layout / typography:** `Stack`, `Inline`, `Grid`, `Container`, `Text`,
  `Heading` (semantic `level` decoupled from visual `size`), `Link`.
- **Notifications:** mount a `<Toaster />` once at the app root and call
  `const { toast } = useToast()` anywhere — no provider needed (the queue lives
  in a module store). `Snackbar` stays the controlled primitive.
  ```tsx
  <Toaster placement="bottom-right" />;
  const { toast } = useToast();
  toast.success('Saved'); // or toast({ severity, title, description })
  ```
- **Form layer:** `FormField` (+ headless `useField`) for custom controls,
  `NumberField`, `Slider`, `TagInput`, and `Combobox` (searchable single-select).

A few ergonomics notes:

- **`ConfirmDialog` confirm semantics (#9):** on confirm, `onConfirm()` fires
  **first**, then `onOpenChange(false)`. So a side effect wired into
  `onOpenChange` (e.g. "clear the selected row on close") also runs on the
  confirm path — distinguish confirm vs. dismiss using `onConfirm`, not
  `onOpenChange`.
- **`Chip.label` is now `ReactNode` (#9):** richer labels (glyph + text) work
  directly. When `label` isn't a string and the chip is deletable, pass
  `deleteLabel` so the delete button keeps a meaningful accessible name
  (otherwise it falls back to `"Remove"`).
- **`Dialog` gains `initialFocus` (#11):** a ref or selector for the element to
  focus on open, overriding the native default (the Close button) — ideal for
  form dialogs. `ConfirmDialog` defaults initial focus to the confirm button.
- **`Select` gains `required` (#11):** renders the `*` indicator and sets
  `aria-required`, matching `TextField`/`Textarea`.
- **`PageHeader.breadcrumbs` widened (#10):** pass a `BreadcrumbItem[]` and
  `PageHeader` renders one internal `<Breadcrumbs>` (a single `nav` landmark).
  A `ReactNode` is now rendered **without** a wrapping `<nav>` (it owns its own
  landmark), which fixes the nested-duplicate-`nav` a11y issue when passing your
  own `<Breadcrumbs>`. If you relied on `PageHeader` wrapping a passed node in a
  `<nav aria-label="Breadcrumb">`, either pass items as an array or add the
  landmark to your node.
- **`Link` default underline (#13):** `Link` defaults to `underline="always"`
  so links in body text are distinguishable without relying on color (WCAG
  link-in-text-block). Use `underline="hover"`/`"none"` for standalone links
  (nav, lists).

---

# Migration Guide: v0.x (MUI) → v1 (custom build)

This is a **clean-break major version**. `@koduhai/design-system` v1 is a
from-scratch rebuild with **no Material UI dependency**. The v0.x line wrapped
MUI components and re-exposed their props; v1 ships its own accessible
primitives styled with CSS Modules and CSS custom properties.

Because the package name is unchanged, upgrading is a `npm install` away — but
the component APIs deliberately changed, so **migration is manual**. This guide
covers the **six components shipped in Phase 1** plus the theme/provider setup.
Anything not listed here is **not yet available in v1**; see
[Not yet available in v1](#not-yet-available-in-v1) and stay on v0.x for those.

> Every prop mapping below was verified against the v1 and v0.x source. Where an
> old prop has no v1 equivalent, it is called out explicitly. Anything uncertain
> is flagged with a **Note**.

## Contents

- [Key concept changes](#key-concept-changes)
- [Setup / theming migration](#setup--theming-migration)
- [Button](#button)
- [LoadingButton](#loadingbutton)
- [Chip](#chip)
- [Avatar](#avatar)
- [StatusBadge](#statusbadge)
- [Alert](#alert)
- [Not yet available in v1](#not-yet-available-in-v1)

## Key concept changes

These themes run through every component, so internalize them once:

- **No MUI props.** `sx`, `color` (MUI palette names), MUI `variant` values,
  and the rest of the inherited MUI prop surface are gone. v1 components accept
  only the props documented in their own interfaces.
- **`variant` is now visual style, `tone` is semantic color.** Old MUI used
  `variant="contained|outlined|text"` plus `color="primary|secondary|error|…"`.
  v1 splits these: `variant` controls the fill style and `tone` controls the
  semantic color (`primary | neutral | danger`).
- **`size` uses `sm | md | lg`**, not MUI's `small | medium | large`.
- **`component=` / polymorphism is now `asChild`** (Button only). Instead of
  `component={Link}`, render the element you want as the single child and pass
  `asChild`.
- **Styling is via CSS custom properties + `className`.** There is no `sx`.
  Theme is driven by a `data-theme` attribute on `<html>`, not a React theme
  object.

## Setup / theming migration

### v0.x (MUI ThemeProvider)

```tsx
import { KoduhThemeProvider, useThemeMode } from '@koduhai/design-system';

function App() {
  return (
    <KoduhThemeProvider defaultMode="dark">
      <YourApp />
    </KoduhThemeProvider>
  );
}
```

Under the hood v0.x rendered MUI's `<ThemeProvider>` + `<CssBaseline>` with
`darkTheme` / `lightTheme`, persisted the mode to the `koduhai-theme-mode`
localStorage key, and exposed `useThemeMode()` (`{ mode, toggleMode }`).

### v1 (KoduhThemeProvider + CSS imports)

```tsx
// 1. Import the stylesheets ONCE, at your app entry point.
import '@koduhai/design-system/theme.css'; // design tokens → CSS variables
import '@koduhai/design-system/styles.css'; // component styles

// 2. Wrap your app.
import { KoduhThemeProvider, useColorMode } from '@koduhai/design-system';

function App() {
  return (
    <KoduhThemeProvider defaultMode="dark">
      <YourApp />
    </KoduhThemeProvider>
  );
}
```

What changed:

- **CSS imports are now required.** v1 styling lives in two stylesheets you must
  import yourself (the package no longer injects styles at runtime via Emotion):
  - `@koduhai/design-system/theme.css` — token definitions (the
    `data-theme="dark"` / `data-theme="light"` CSS variable sets).
  - `@koduhai/design-system/styles.css` — the component CSS Modules output.
- **The hook was renamed** `useThemeMode()` → `useColorMode()`. The v1 hook
  returns `{ mode, setMode, toggleMode }` — note it adds an explicit
  `setMode(mode)` setter that v0.x did not have.
- **`data-theme` model.** `KoduhThemeProvider` sets `data-theme` on
  `document.documentElement` (in a `useEffect`); tokens resolve from that
  attribute. There is no MUI theme object and no `<CssBaseline>`.
- **localStorage key changed** from `koduhai-theme-mode` to `koduh-color-mode`.
  v1 also lets you override it via the `storageKey` prop and turn persistence
  off with `disablePersistence`.

#### Provider prop mapping

| v0.x prop           | v1 prop              | Notes                                                                                   |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `defaultMode`       | `defaultMode`        | Same name and default (`'dark'`).                                                       |
| `mode` (controlled) | _removed_            | v1 has no controlled `mode` prop. Drive mode imperatively via `useColorMode().setMode`. |
| —                   | `storageKey`         | New. localStorage key; defaults to `'koduh-color-mode'`.                                |
| —                   | `disablePersistence` | New. Skips reading/writing localStorage.                                                |

> **SSR / static hosting:** because v1 applies `data-theme` in an effect, a
> server-rendered or pre-rendered page can flash the wrong theme for one frame
> before hydration. The README documents a tiny blocking inline `<head>` script
> that sets `data-theme` before first paint — see **"Avoiding a theme flash"**
> in [README.md](./README.md). Use the same defaults: key `koduh-color-mode`,
> fallback `'dark'`, attribute `data-theme` on `<html>`.

## Button

In v0.x `Button` was a thin wrapper over MUI's `<Button>` (it defaulted
`variant="contained"` and `size="medium"`) and inherited the full MUI Button
prop surface. v1 is a custom button with its own props.

### Prop mapping

| v0.x (MUI) prop                        | v1 prop                                    | Notes                                                                          |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `variant="contained"`                  | `variant="solid"` _(default)_              | Renamed values.                                                                |
| `variant="outlined"`                   | `variant="outline"`                        |                                                                                |
| `variant="text"`                       | `variant="ghost"`                          |                                                                                |
| `color="primary"`                      | `tone="primary"` _(default)_               | Color moved off `variant` onto the new `tone` prop.                            |
| `color="error"`                        | `tone="danger"`                            |                                                                                |
| `color="secondary"` / `"info"` / …     | `tone="neutral"` (closest)                 | v1 only has `primary \| neutral \| danger`. Map other MUI colors to `neutral`. |
| `size="small \| medium \| large"`      | `size="sm \| md \| lg"`                    | `md` is the default.                                                           |
| `fullWidth`                            | `fullWidth`                                | Same.                                                                          |
| `startIcon` / `endIcon`                | `startIcon` / `endIcon`                    | Same. (Ignored when `asChild`.)                                                |
| `component={X}` / `href`               | `asChild` (wrap your own element)          | Render the target element as the single child; button props merge onto it.     |
| `disabled`, `onClick`, other DOM props | inherited (extends `ButtonHTMLAttributes`) | Standard `<button>` attributes pass through.                                   |
| `sx`                                   | `className` (+ CSS variables)              | No `sx`. Use `className`.                                                      |
| `disableElevation`, `disableRipple`, … | _removed_                                  | MUI-specific; no equivalent (v1 has no ripple/elevation system).               |

> **Note (`tone` mapping):** v1 intentionally ships only three tones. MUI colors
> beyond `primary`/`error` (e.g. `secondary`, `info`, `success`, `warning`) have
> no exact match — map them to `neutral`, or use a more specific component
> (`StatusBadge`, `Alert`) where the semantics fit.

### Before / after

```tsx
// v0.x
<Button variant="contained" color="error" size="small" onClick={save}>
  Delete
</Button>

// v1
<Button variant="solid" tone="danger" size="sm" onClick={save}>
  Delete
</Button>
```

```tsx
// v0.x — polymorphic button as a link
<Button component="a" href="/docs">Docs</Button>

// v1 — asChild
<Button asChild>
  <a href="/docs">Docs</a>
</Button>
```

## LoadingButton

v0.x `LoadingButton` extended the v0.x `ButtonProps` (so it carried all the MUI
Button props) and rendered an MUI `<CircularProgress>`. v1 extends the v1
`ButtonProps`, so all the Button changes above apply here too.

### Prop mapping

| v0.x prop                              | v1 prop                | Notes                                                                       |
| -------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `loading`                              | `loading`              | Same. Disables the button and sets `aria-busy` while loading.               |
| `loadingPosition="start\|center\|end"` | _removed_              | v1 always shows the spinner in the `startIcon` slot. No positional control. |
| —                                      | `loadingText`          | New. Screen-reader-only text announced while loading (e.g. `"Saving…"`).    |
| (all `ButtonProps`)                    | (all v1 `ButtonProps`) | `variant`/`tone`/`size`/etc. follow the [Button](#button) mapping.          |

> **Note:** v0.x defaulted `loadingPosition` to `'center'` (it hid the label and
> swapped in the spinner). v1 keeps the label and shows the spinner before it.
> There is no v1 equivalent for `loadingPosition`; if you relied on it, drop it.

### Before / after

```tsx
// v0.x
<LoadingButton loading={saving} loadingPosition="start" variant="contained">
  Save
</LoadingButton>

// v1
<LoadingButton loading={saving} loadingText="Saving…" variant="solid">
  Save
</LoadingButton>
```

## Chip

v0.x `Chip` wrapped MUI's `<Chip>` (defaulting `size="small"`,
`variant="filled"`) and inherited MUI's chip props (`label`, `color`, `onDelete`,
`deleteIcon`, `clickable`, `avatar`, `icon`, …). v1 has a focused, explicit API.

### Prop mapping

| v0.x (MUI) prop                 | v1 prop                               | Notes                                                                         |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `label`                         | `label` (required `string`)           | Now a required string prop.                                                   |
| `variant="filled"`              | `variant="solid"` _(default)_         | Renamed.                                                                      |
| `variant="outlined"`            | `variant="outline"`                   |                                                                               |
| `color="primary \| error \| …"` | `tone="primary \| neutral \| danger"` | `neutral` is the default. Map other MUI colors to `neutral`.                  |
| `size="small \| medium"`        | `size="sm \| md"`                     | `md` is the default.                                                          |
| `icon`                          | `icon`                                | Leading decorative icon. Same idea.                                           |
| `onClick`                       | `onClick`                             | Makes the chip a `<button>`. **Only when `onDelete` is not set** (see note).  |
| `onDelete`                      | `onDelete`                            | Adds a labelled delete button.                                                |
| `deleteIcon`                    | _removed_                             | v1 always uses its own close icon.                                            |
| —                               | `deleteLabel`                         | New. Accessible label for the delete button (defaults to `"Remove <label>"`). |
| `avatar`                        | _removed_                             | No avatar slot in v1.                                                         |
| `clickable`                     | _removed_                             | Implicit: passing `onClick` makes it interactive.                             |
| `sx`                            | `className`                           | No `sx`.                                                                      |

> **Note (interactive + deletable):** In v1, a chip becomes an interactive
> `<button>` only when `onClick` is set **and** `onDelete` is **not**. If both
> are set, the root stays a `<span>` and only the delete affordance is a button.
> If you previously relied on a chip being both clickable and deletable as one
> button, revisit the interaction.

### Before / after

```tsx
// v0.x
<Chip label="Beta" color="primary" variant="filled" size="small" onDelete={remove} />

// v1
<Chip label="Beta" tone="primary" variant="solid" size="sm" onDelete={remove} />
```

## Avatar

v0.x `Avatar` wrapped MUI's `<Avatar>`, mapped a `size` token
(`small | medium | large` → 24/40/56px) onto `sx`, and inherited MUI Avatar
props (`src`, `alt`, `children`, `variant`, …). v1 derives initials from `name`
and renders a plain `<span>`/`<img>`.

### Prop mapping

| v0.x (MUI) prop                       | v1 prop                  | Notes                                                                                     |
| ------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `size="small\|medium\|large"`         | `size="sm\|md\|lg"`      | Renamed values. `md` is the default.                                                      |
| `src`                                 | `src`                    | Same. When set, renders an `<img>`.                                                       |
| `alt`                                 | `alt`                    | Same; used as the image alt text.                                                         |
| `children` (initials/content)         | `name`                   | v1 has no `children`. Pass `name`; v1 derives up-to-2-letter initials and the aria-label. |
| `variant="circular\|rounded\|square"` | `shape="circle\|square"` | Renamed. v1 has no `rounded` — use `square`.                                              |
| `sx`                                  | `className` / `style`    | v1 accepts `className` and `style` (no `sx`).                                             |
| `sizes` and other MUI props           | _removed_                | MUI-specific; no equivalent.                                                              |

> **Note (`shape`):** v0.x exposed MUI's `variant` (`circular | rounded |
square`). v1 uses `shape` with only `circle | square`. There is **no
> `rounded`** in v1 — the closest mapping is `square`.

### Before / after

```tsx
// v0.x
<Avatar size="large" src={user.photo} alt={user.name}>
  {user.initials}
</Avatar>

// v1
<Avatar size="lg" src={user.photo} alt={user.name} name={user.name} />
```

## StatusBadge

v0.x `StatusBadge` rendered the v0.x `Chip` with a per-status color/label config
(`active→success`, `inactive→default`, `pending→warning`, `error→error`) and
defaulted the label from the status. v1 is a standalone `<span>` with a colored
dot and an always-rendered label.

### Prop mapping

| v0.x prop          | v1 prop                        | Notes                                                                                           |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `status`           | `status`                       | Same values: `active \| inactive \| pending \| error`.                                          |
| `label` (optional) | `label` (**required**)         | In v0.x the label defaulted from the status (e.g. `active → "Active"`). In v1 you must pass it. |
| —                  | `variant="solid \| subtle"`    | New. Defaults to `'subtle'`. (v0.x had no variant.)                                             |
| (MUI Chip props)   | (DOM `<span>` attributes only) | v1 extends `HTMLAttributes<HTMLSpanElement>`; the MUI Chip prop surface is gone.                |

> **Note (required `label`):** This is a behavior change — v0.x would render a
> default label per status. In v1 you must supply `label` explicitly (color is
> never the only signal). When migrating, pass the same text v0.x generated
> (`Active`, `Inactive`, `Pending`, `Error`) unless you want different copy.

### Before / after

```tsx
// v0.x — label defaulted to "Active"
<StatusBadge status="active" />

// v1 — label is required
<StatusBadge status="active" label="Active" />
```

## Alert

v0.x `Alert` wrapped MUI's `<Alert>` (defaulting `severity="info"`,
`variant="filled"`), supported a `title`, and rendered an MUI `IconButton`
close button only when both `closable` **and** `onClose` were set. v1 is a
custom alert.

### Prop mapping

| v0.x (MUI) prop                            | v1 prop               | Notes                                                                                                      |
| ------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `severity="info\|success\|warning\|error"` | `severity` (required) | Same values; now a **required** prop (v0.x defaulted to `'info'`).                                         |
| `title`                                    | `title`               | v1 widened the type from `string` to `ReactNode`.                                                          |
| `closable`                                 | `dismissable`         | Renamed. v1 shows the dismiss button whenever `dismissable` is true (does **not** also require `onClose`). |
| `onClose`                                  | `onClose`             | Called on dismiss. No longer gates whether the button renders.                                             |
| `children` (message)                       | `children`            | Same.                                                                                                      |
| `variant="filled\|outlined\|standard"`     | _removed_             | v1 has a single visual style. No `variant`.                                                                |
| `icon` (MUI)                               | `icon`                | Custom leading icon. **v1 addition:** pass a falsy value (e.g. `null`) to disable the icon.                |
| `action`                                   | _removed_             | No custom action slot in v1 (only the built-in close button).                                              |
| `sx`                                       | `className`           | No `sx`.                                                                                                   |

> **Note (role/severity):** v1 sets ARIA role automatically from severity
> (`warning`/`error` → `alert`, `info`/`success` → `status`). You generally do
> not need to set `role` yourself.

### Before / after

```tsx
// v0.x
<Alert severity="error" variant="filled" title="Failed" closable onClose={dismiss}>
  Could not save changes.
</Alert>

// v1
<Alert severity="error" title="Failed" dismissable onClose={dismiss}>
  Could not save changes.
</Alert>
```

## Not yet available in v1

v1 currently ships **only** the six components above. The following v0.x exports
have **no v1 equivalent yet** — keep depending on the v0.x package for these
until later phases land:

**Intentionally out of scope for v1** (not planned for the v1 spec):

- `Dialog`
- `ConfirmDialog`
- `DataTable`
- `Snackbar`

**Arriving in later phases** (Phases 2–4):

- `IconButton`
- `Link`
- `TextField`
- `Select` / `Autocomplete`
- `DatePicker`
- `Card`
- `AppBar`
- `Sidebar`
- `Tabs` / `TabPanel`
- `Tooltip`
- `Skeleton` (incl. `CardSkeleton`, `StatStripSkeleton`)
- `EmptyState`
- `PageHeader`
- `SectionHeading`
- `StatStrip`
- `CTABanner`

> **Practical tip:** the package name is the same, so you cannot install both
> versions side by side under one name. If you depend on any not-yet-available
> component, stay on the latest v0.x release until its v1 replacement ships, then
> migrate per-component using the tables above.
