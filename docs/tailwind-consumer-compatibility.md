# Using `@koduhai/design-system` from a Tailwind app (koduh-mail-web)

Assessment + adoption guide for teams whose app is built on **TailwindCSS** rather than
on this design system's provider. Written against `koduh-three/koduh-mail-web` (React 19,
Vite, Tailwind 3.4 `darkMode: 'class'`, `lucide-react`, Recharts), but applies to any
Tailwind consumer.

## Verdict

**Yes — it works, and the two systems coexist in one app.** Our component styles are
scoped CSS Modules (hashed class names), so they never collide with Tailwind's global
utilities. React 19 is a supported peer, there are zero runtime dependencies, and icons
accept any `ReactNode` (so `lucide-react` drops straight in). The blockers were never
fundamental — they were three integration seams, two of which are now closed in the
library itself.

## Architecture at a glance

|              | koduh-mail-web                                             | @koduhai/design-system                                                    |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Styling      | Tailwind utilities (`bg-brand-600`, `dark:`)               | CSS Modules + `--ku-*` token variables                                    |
| Dark mode    | `.dark` **class** on `<html>` (`useTheme`, key `km_theme`) | `data-theme` **attribute** (`KoduhThemeProvider`, key `koduh-color-mode`) |
| Brand color  | Tailwind blue scale (`brand-50…900`)                       | semantic `--ku-color-primary` (single tone)                               |
| Icons        | `lucide-react`                                             | any `ReactNode` — no conflict                                             |
| Charts       | Recharts (lazy)                                            | own `Sparkline` / `Chart`                                                 |
| Runtime deps | —                                                          | none                                                                      |

## The three seams

### 1. Dark mode didn't sync — FIXED in the library

Their `useTheme()` toggles a `.dark` **class**; our `theme.css` originally only responded
to a `data-theme` **attribute**. A dropped-in `<Button>` would have ignored their toggle.

`scripts/generate-theme-css.ts` now emits the theme overrides under **both** strategies:

```css
:root[data-theme='dark'], [data-theme="dark"], :root.dark, .dark { … }
:root[data-theme='light'], [data-theme="light"], :root.light, .light { … }
```

So our tokens now follow Tailwind's `darkMode: 'class'` signal automatically.

**SSR / no-flash.** On a server-rendered app (Next.js/Remix), `KoduhThemeProvider`
only sets the theme after hydration, which flashes the wrong theme on first paint.
Drop a `<KoduhThemeScript />` into the document `<head>` to apply the persisted
preference synchronously before paint. See [`docs/ssr.md`](./ssr.md).

**One caveat — the default.** `:root` is **dark by default** (unchanged, so existing
consumers aren't affected). Tailwind's class strategy treats _absence_ of `.dark` as
light. mail-web's `applyClass()` only toggles `.dark`, so in light mode (no class) our
tokens would fall back to the dark `:root`. The fix is one line — toggle `.light`
explicitly too:

```ts
// src/hooks/useTheme.ts
function applyClass(resolved: Resolved) {
  const el = document.documentElement;
  el.classList.toggle('dark', resolved === 'dark');
  el.classList.toggle('light', resolved === 'light'); // ← add: lets DS tokens reach the light palette
}
```

### 2. Color identity diverged — bridged by the Tailwind preset (FIXED in the library)

New entry point: **`@koduhai/design-system/tailwind-preset`**. It maps our semantic color
tokens onto Tailwind's palette as CSS _variables_, so utilities resolve to our tokens and
stay theme-reactive:

```js
// tailwind.config.js
import koduhaiPreset from '@koduhai/design-system/tailwind-preset';

export default {
  presets: [koduhaiPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
};
```

Utilities it adds (all `var(--ku-color-*)`, so dark/light follow automatically):

| Utility examples                                             | Token                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `bg-primary`, `text-primary-contrast`                        | `--ku-color-primary` / `-contrast`                     |
| `text-danger-fg`, `bg-success`, `text-warning-fg`, `bg-info` | status tones (+`-fg` text variants)                    |
| `bg-accent`, `text-accent-fg`                                | brand accent tone (+`-fg` text variant)                |
| `bg-canvas`, `bg-surface`, `bg-raised`                       | `--ku-color-bg-default` / `-surface` / `-raised`       |
| `text-fg`, `text-fg-muted`, `text-fg-disabled`               | `--ku-color-text-primary` / `-secondary` / `-disabled` |
| `border-border`                                              | `--ku-color-border`                                    |
| `bg-chart-1` … `bg-chart-8`                                  | categorical chart palette                              |
| `font-sans`, `font-mono`                                     | `--ku-font-family-base` / `-mono`                      |

**Scope on purpose:** the preset maps **only colors + fontFamily**. It does _not_ touch
`spacing`, `borderRadius`, or `fontSize`, because overriding those would clobber the
built-in Tailwind scales (`p-4`, `rounded-md`, `text-sm`, …) the app already relies on.
Backgrounds/text are renamed (`canvas`/`surface`/`raised`, `fg`/`fg-muted`/`fg-disabled`)
to avoid awkward `bg-bg-*` / `text-text-*` class names.

Requires importing the variables once at app entry:

```ts
import '@koduhai/design-system/theme.css';
```

### 3. Duplicate component set — adopt incrementally (consumer decision)

mail-web already has Tailwind-built `Button, Card, Input, Badge, Modal, Snackbar,
ConfirmDialog, SlideOver`, etc. (`src/components/ui/`). Replacing those wholesale is low
value. **Lead with what they don't have:** `DataTable`, `DatePicker`/`Calendar`,
`Toaster`/`useToast`, `CommandPalette`, `FileUpload`, `Tree`, `Stepper`, `Combobox`, and
the `Form`/`useForm` orchestration layer. Migrate the simple primitives later (or never).

## Adoption checklist for koduh-mail-web

1. `npm i @koduhai/design-system` (GitHub Packages registry — see the demo-consumer setup).
2. Import `@koduhai/design-system/theme.css` once in `src/main.tsx`.
3. Add `presets: [koduhaiPreset]` to `tailwind.config.js` (keep `darkMode: 'class'`).
4. Add the `.light` toggle line to `useTheme.ts` (see seam #1).
5. Start using a component with no in-house equivalent (e.g. `<DataTable>` on a list page).
6. Optionally migrate `brand-600` usages to `bg-primary` to unify the accent.

## Remaining decisions / gaps (not blockers)

- **No tint scale.** We ship a single semantic `primary`, not a `50…900` ramp like their
  `brand-*`. Utilities that lean on `brand-100`/`brand-50` (subtle hover/fills) have no
  one-to-one token. Options: keep `brand-*` for those tints, or extend tokens with a ramp.
  Worth a follow-up if they want full brand unification.
- **`styles.css` carries our reset.** `@koduhai/design-system/styles.css` bundles the
  component CSS _and_ a light global reset, which overlaps Tailwind's Preflight. It's
  intentionally minimal and honors `prefers-reduced-motion`; load it after Tailwind's base
  layer and spot-check headings/lists. If conflicts appear, we can split the reset into its
  own optional import.
- **Accent value differs.** Our `primary` (dark `#5B9DFF`, light `#1B5FCC`) is not their
  Tailwind blue `#2563eb`. Unifying means either they adopt our token or we retune the
  token to their brand — a design call, not a code one.

## What changed in this library

- `scripts/generate-theme-css.ts` — theme overrides now also match `.dark` / `.light`
  classes (+ tests in `generate-theme-css.test.ts`).
- `src/tailwind-preset/index.ts` — new `@koduhai/design-system/tailwind-preset` entry
  (+ tests). Wired into `tsup.config.ts` and `package.json` `exports`.
