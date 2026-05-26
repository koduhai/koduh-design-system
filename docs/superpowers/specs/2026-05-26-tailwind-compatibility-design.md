# Tailwind consumer compatibility — readying the design system

**Date:** 2026-05-26
**Branch:** `feat/tailwind-compat`
**Status:** approved design, pending implementation plan
**Driver:** make `@koduhai/design-system` adoptable by `koduh-three/koduh-mail-web` (a Tailwind-first React 19 app) without forcing it off Tailwind.

## Goal

Ship a single **minor** release (2.6.0 → 2.7.0) that makes the design system work cleanly inside a Tailwind app using `darkMode: 'class'`, and fills the three genuine gaps a like-for-like comparison with koduh-mail-web revealed. No changes are made in the koduh-mail-web repo; it adopts on its own schedule. Full consumer guidance already lives in `docs/tailwind-consumer-compatibility.md`.

## Non-goals (YAGNI)

- No changes inside koduh-mail-web (no install, no page migration).
- No wholesale replacement of their in-house `ui/` set.
- No theme-aware brand ramp, no spacing/radius/fontSize mapping in the preset (would clobber Tailwind's built-in numeric scales).
- App-specific glue (`CopyMorphIcon`, `QueryError`, `ThemeToggle`) stays in their repo — not design-system concerns.

## Background: the gap analysis

koduh-mail-web has 19 UI primitives in `src/components/ui/`. Sixteen already have a DS equivalent (Badge→`Chip`/`StatusBadge`, Breadcrumbs, Button, Card, ConfirmDialog, EmptyState, FormField, Input→`TextField`, Modal→`Dialog`, PageHeader, PageLayout→`Container`/`Stack`, Skeleton, SlideOver→`Drawer`, Snackbar, plus their tables→`DataTable`). Three are genuine gaps:

1. **PasswordInput** — show/hide toggle; used on Login/Register/Profile.
2. **CountUp** — animated number; used on stats/dashboard.
3. **Brand tint ramp** (`brand-50…900`) — a *token* gap, not a component; their `bg-brand-100`/`bg-brand-600` utilities have no DS equivalent.

## Already built on this branch (commit as-is)

These two changes are implemented, tested, and verified (build/typecheck/lint/16 unit tests/verify:exports all green). They are part of this release:

- **Class-based theming.** `scripts/generate-theme-css.ts` emits theme overrides under `.dark` / `.light` classes in addition to `[data-theme]`, so DS tokens follow Tailwind's `darkMode: 'class'` signal. `:root` stays dark-by-default (existing consumers unaffected); a class-strategy app whose light state is "no class" must toggle `.light` explicitly (one-line, documented).
- **`@koduhai/design-system/tailwind-preset`** (`src/tailwind-preset/index.ts`). Maps semantic color tokens onto Tailwind's palette as `var(--ku-color-*)` (colors + fontFamily only). Backgrounds renamed canvas/surface/raised; text renamed fg/fg-muted/fg-disabled to avoid `bg-bg-*` / `text-text-*`. Wired into `tsup.config.ts` and `package.json` `exports`.

## New work

### 1. Brand tint ramp (token)

A **fixed, theme-independent** 10-step blue scale anchored on the DS light primary, added to `tokens` in `src/theme/tokens.ts` (theme-independent scales, NOT `themes`). `generate-theme-css.ts` already iterates `tokens`, so it emits `--ku-brand-50 … --ku-brand-900` on `:root` with no generator code change.

Anchor: `brand-600 = #1B5FCC` (the DS light `primary`). Proposed ramp (final hex tuned during implementation for even perceptual steps; 600 is fixed):

| Step | Hex |
|------|-----|
| 50  | `#EFF4FE` |
| 100 | `#DBE6FD` |
| 200 | `#BCD0FB` |
| 300 | `#8FB1F7` |
| 400 | `#5B8BF0` |
| 500 | `#3468E0` |
| 600 | `#1B5FCC` |
| 700 | `#1A4FA8` |
| 800 | `#173F84` |
| 900 | `#143568` |

Semantics: `brand` is the **fixed ramp** (same in dark and light, like Tailwind); the semantic `primary` token remains **theme-adaptive** (dark `#5B9DFF`, light `#1B5FCC`). They intentionally differ and this is documented in the consumer guide.

**Preset:** add `colors.brand = { 50: 'var(--ku-brand-50)', … 900: … }`, derived programmatically from the token keys so it cannot drift.

**Tests:** generator test asserts `--ku-brand-600: #1B5FCC;` on `:root` and that all 10 steps emit; preset test asserts `brand` has 10 keys and `brand['600']` maps to `var(--ku-brand-600)`.

### 2. `PasswordInput` component

A thin wrapper over `TextField` adding a trailing show/hide toggle. Folder `src/components/PasswordInput/` with the standard five files; exported (component + props type) from `index.ts` and re-exported from `src/index.ts`.

Behavior:
- Internally renders `TextField` with `type` switching `password` ↔ `text` from internal `visible` state (uncontrolled; defaults hidden).
- Trailing adornment is a real `<button type="button">` with an eye / eye-off icon (from `src/icons`), `aria-label` ("Show password" / "Hide password") that updates with state, and `aria-pressed`. Keyboard-operable, AA focus ring via the shared focus-ring token, reduced-motion safe.
- `forwardRef` to the underlying input; `className` forwarded to the field root; remaining `TextField` props pass through (label, error, helperText, etc.). Toggle does not steal focus from the field on click.

**Tests:** toggling flips input `type` and the button's `aria-label`/`aria-pressed`; ref points at the input; className passthrough. a11y story (dark + light) → axe clean.

### 3. `CountUp` component

Animates a number from `from` (default 0) to `value` over `duration` via `requestAnimationFrame`. Folder `src/components/CountUp/` with the standard five files; exported from `index.ts` and `src/index.ts`.

Props: `value: number`, `from?: number` (0), `duration?: number` ms (default ~800), `decimals?: number` (0), `format?: (n: number) => string` (override formatting, e.g. currency/percent), `className`. Renders a single `<span>` (forwardRef to it; DOM props spread).

Behavior:
- On mount and whenever `value` changes, animate from the current displayed value to `value` with an ease-out curve, cancelling any in-flight frame.
- **`prefers-reduced-motion: reduce` → no animation**; render the final formatted value immediately.
- Cleans up its rAF on unmount. No token-color dependency (pure presentation).

**Tests:** reaches the final value; with reduced-motion mocked, renders the final value without animating; `format`/`decimals` applied. a11y story → axe clean.

## Testing & verification gate (all green before merge)

- Unit (Vitest): new component tests + extended generator/preset tests.
- Types: `tsc --noEmit`.
- a11y: new Storybook stories run through axe in **dark and light** (zero violations). Any new visual snapshots are regenerated via the `update-baselines` workflow on the ubuntu-24.04 runner — never committed from local Windows.
- `verify:exports`: passes; CLAUDE.md component count updated 70 → 72.
- `npm run build` succeeds (tokens + tsup), including the new entry point.

## Release

- `package.json` 2.6.0 → **2.7.0** (new public entry point + components ⇒ minor). Update `package-lock.json`.
- `CHANGELOG.md`: class-based theming, `tailwind-preset` entry, brand ramp, `PasswordInput`, `CountUp`.
- CLAUDE.md: document the `tailwind-preset` entry point and class-based theming under the token pipeline; bump component count to 72.
- Land via a PR into `main` (branch-protected). The `v2.7.0` GitHub Release is cut **only after explicit go-ahead** (it triggers publish to GitHub Packages).

## Build order

1. Brand ramp in `tokens.ts` + generator test.
2. Preset `colors.brand` wiring + preset test.
3. `PasswordInput` and `CountUp` — independent, buildable in parallel.
4. Docs + version bump + CLAUDE.md count.
5. Verification gate → PR.

## Risks / open points

- **Brand ramp hex tuning.** The non-600 steps are provisional; final values tuned for even perceptual spacing during implementation. 600 is fixed at `#1B5FCC`.
- **Reset overlap.** `styles.css` still bundles a light reset overlapping Tailwind Preflight — out of scope here, tracked as a follow-up in the consumer guide.
- **No tint ramp for status tones.** Only `brand` gets a ramp; success/warning/danger remain single semantic tokens. Acceptable — mail-web only ramps `brand`.
