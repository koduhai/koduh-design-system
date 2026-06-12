# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@koduhai/design-system` v1 — a from-scratch React component library that deliberately has **zero dependency on MUI, Emotion, or any third-party component/styling library** (it replaces an older MUI-wrapper-based v0.x). Styling is zero-runtime: design tokens compile to CSS custom properties, component styles are CSS Modules. React 18/19 are peer dependencies; there are no runtime dependencies. WCAG AA is a hard requirement.

The full design spec is `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` — read it before non-trivial work. Delivery is phased (§15 of the spec): Phase 0 foundations are done and components have shipped through Phases 1–9 plus the v2 issue follow-ups (81 components — layout/typography primitives, a `Toaster`/`useToast` notification layer, a `FormField`-led form layer with a `Form`/`useForm` orchestration layer (values, validation via a Standard-Schema resolver, field arrays, error summary — #38), the #12 gap-fill batch, and the #27–#35 batch: a `Calendar`/`DatePicker` date layer, `Sparkline`/`Chart` data-viz, density modes, DataTable row-expansion/column-resize/server-side hooks, and a wave of P2 components — `Kbd`, `AspectRatio`, `Code`, `Collapsible`, `ScrollArea`, `Rating`, `Stepper`, `Timeline`, `HoverCard`, `PinInput`, `FileUpload`, `Tree`, `Carousel`, `CommandPalette`), and a Tailwind-consumer compatibility batch (class-based theming, a `tailwind-preset` entry point, a fixed brand tint ramp, `PasswordInput`, `CountUp` — see `docs/tailwind-consumer-compatibility.md`), and the #43 component round-out (`Banner`, `ButtonGroup`, `SplitButton`, `Meter`, `NotificationBadge`, `Popconfirm`, `ColorPicker`), and the date/time-layer expansion (#42/#61 — a segmented `TimePicker`, `Calendar` range mode + `DateRangePicker`, with `DatePicker` date+time to follow). `src/index.ts` is the source of truth for which components are shipped; it grows as each component lands. The component count below (81) is verified against `src/index.ts` by `verify:exports`.

## Commands

```bash
npm run build            # build:tokens, then tsup → dist (CJS + ESM + .d.ts)
npm run build:tokens     # regenerate dist/theme.css from src/theme/tokens.ts
npm run typecheck        # tsc --noEmit (strict)
npm run lint             # eslint src
npm run format           # prettier --write src
npm test                 # vitest run (unit, jsdom)
npm run test:watch       # vitest watch
npm run test:e2e         # playwright (axe a11y) — auto-starts Storybook on :6006
npm run storybook        # dev docs at http://localhost:6006
```

Run a single unit test file or test:

```bash
npx vitest run src/components/Button/Button.test.tsx
npx vitest run -t "renders solid variant"
```

## Workflows (slash commands)

Two recurring maintainer flows are encoded as slash commands in `.claude/commands/`:

- **`/ship-issue <n>`** — take issue #n end-to-end: triage → implement (superpowers + parallel
  subagents for build work) → feature branch → PR → release → close the issue → file follow-ups.
  Full steps in `.claude/commands/ship-issue.md`.
- **`/audit-components [name]`** — sweep components for naming/convention consistency (tone/size
  vocab, `data-*` variant styling, prop conventions, overlay API, exports, folder shape, token
  usage, a11y/RTL). Reports first; edits only on approval. See `.claude/commands/audit-components.md`.

## Architecture

Four layers, low → high. Each only depends on layers below it; no component reads another component's internals.

1. **Tokens** (`src/theme/tokens.ts`) — the single source of truth. Theme-independent scales live in `tokens`; color values that differ between dark/light live in `themes`. Components **never** import these values at runtime — they read the generated CSS variables.
2. **Primitives & utilities** (`src/primitives`, `src/utils`, `src/styles/reset.css`) — the from-scratch infra that replaces what MUI gave implicitly: `Slot`/`asChild`, `mergeRefs`, `composeEventHandlers`, `useId`, `useControllableState`, `VisuallyHidden`, `cx`, and the reset. There is intentionally **no Portal or FocusTrap**: overlay components (Dialog/Snackbar/Popover/Menu/Tooltip/Select) are implemented with platform primitives instead — native `<dialog>` + `showModal()` for Dialog, the Popover API for floating layers, and CSS anchor positioning for placement. Caveat: the Popover API and CSS anchor positioning are Chromium-first; Firefox/Safari support lags, so non-anchor browsers fall back to JS positioning.
3. **Components** (`src/components/<Name>/`) — each is a self-contained folder: `Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`, `index.ts`.
4. **Provider & entry** (`src/provider`, `src/index.ts`, `src/icons`) — `KoduhThemeProvider` sets `data-theme` on `<html>`, persists to localStorage, exposes `useColorMode()`, and imports the reset. `src/index.ts` is the main entry; `src/theme` and `src/icons` are separate package entry points.

### The token pipeline (important)

`scripts/generate-theme-css.ts` reads `tokens.ts` and emits `dist/theme.css` — CSS custom properties prefixed `--ku-` with camelCase→kebab-case names (e.g. `tokens.fontSize.md` → `--ku-font-size-md`, `themes.dark.color.bgDefault` → `--ku-color-bg-default`). `dist/theme.css` is **gitignored and generated**, but Storybook's preview and the build both import it, so `build:tokens` must run first. This is wired via the `prestorybook`/`prebuild-storybook` npm hooks and inside `npm run build`; if you edit Storybook config directly or hit a missing-`theme.css` error, run `npm run build:tokens` once. The generation logic is itself unit-tested (`scripts/generate-theme-css.test.ts`).

To change a color, spacing value, radius, etc., edit `tokens.ts` only — never hand-edit `dist/theme.css` (it carries a "do not edit" banner and is overwritten).

The generated `theme.css` applies its dark/light overrides under both the `[data-theme]` attribute (set by `KoduhThemeProvider`) **and** a `.dark`/`.light` class, so consumers using Tailwind's `darkMode: 'class'` get the tokens for free. A separate `@koduhai/design-system/tailwind-preset` entry (`src/tailwind-preset/index.ts`) maps the semantic color tokens + brand ramp onto Tailwind's `theme.extend.colors` as `var(--ku-*)` variables. See `docs/tailwind-consumer-compatibility.md`.

### Component conventions

Look at `src/components/Button/` as the reference implementation. The established patterns:

- **Variant styling via data-attributes, not class composition.** Components set `data-variant`, `data-tone`, `data-size`, etc. on the root element; the `.module.css` selects on them (`.root[data-variant='solid']`). CSS-local custom properties (e.g. `--btn-main`) bridge tone → variant so each variant rule stays small.
- **`cx(styles.root, className)`** merges the scoped module class with a consumer-passed `className` (which is always forwarded to the root).
- **`forwardRef` + spread remaining DOM props** to the root so `aria-*`, `data-*`, `onClick`, `id`, etc. pass through. Props are explicit and typed — no opaque passthrough to a hidden vendor component.
- **`asChild`** (via the `Slot` primitive) for polymorphism instead of an `as`/`component` prop — lets `Button` render as `<a>`, a router `<Link>`, etc., merging className/handlers/refs.
- **Controlled/uncontrolled symmetry** via `useControllableState` for stateful components.
- **Tone vocabulary is shared:** tonal components (`Button`, `Chip`, `Progress`, `ToggleGroup`) use the same `tone` set — `primary | neutral | success | warning | danger | info | accent` — so it's predictable across the library. (`info` is a status blue, `accent` a brand purple; both are token-backed and AA-verified in `contrast.test.ts`.) `Link`/`Spinner` use a deliberate subset. **Typographic tone is a separate axis:** `Text`'s `tone` (`default | secondary`) is text-color semantics, not the action tonal vocab — don't conflate them.
- **Documented convention exceptions** (everything else follows them): `Toaster` is a singleton region — no `forwardRef`/`className` passthrough (configured by `placement`). `Code` exports two roots (`Code`→inline, `CodeBlock`→block), so it uses `styles.inline`/`styles.block` rather than a single `styles.root`. `LoadingButton` composes `Button` and forwards `className` through it. `Alert` keeps `onClose` (no `open` prop).
- **Overlays share an open/close API:** components with an `open` prop (`Dialog`, `ConfirmDialog`, `Snackbar`, `Popover`, `Select`) report close via `onOpenChange(open: boolean)` and take body content as `children`. (`Alert` has no `open` prop, so it keeps a fire-and-forget `onClose`.)
- **Collection controls** are array-driven (`options`/`items`/`entries`) when the component owns item markup + a11y wiring (`Select`, `Tabs`, `Menu`), and `children`-based when each item is a standalone control the consumer composes (`RadioGroup` → `<Radio>`). See `docs/component_guidelines.md` §8.
- Every public prop type is exported from `index.ts` and re-exported from `src/index.ts`.
- Icons accept any `ReactNode` — components never force the in-house icon set on consumers. The vendored set lives in `src/icons` and is built with the `createIcon` factory.

## Testing & a11y

Three layers, all expected to pass before merge: Vitest + Testing Library for behavior, `tsc --noEmit` for types, and Playwright + axe-core for accessibility against Storybook stories in **both** dark and light themes (zero violations). e2e tests parametrize over `['dark', 'light']` and drive Storybook story iframes; document-level axe rules that don't apply to story fragments are disabled per-test (see `e2e/foundations.spec.ts`). Color is never the only signal, and `prefers-reduced-motion` is honored in the reset.

## Build notes

- `tsup.config.ts` uses `loader: { '.css': 'local-css' }`: `*.module.css` class selectors get hashed + a JS name map (so `import styles from './X.module.css'` works), while element/pseudo selectors in `reset.css` stay global and unscoped.
- `clean: false` is deliberate — `build:tokens` writes `dist/theme.css` before tsup runs, and cleaning would delete it.
- `sideEffects` in package.json lists only CSS so JS tree-shakes while bundlers keep the styles.

## Release & CI gotchas

- **`main` is branch-protected.** All changes — including releases — land via a PR, never a direct
  push. A release is: a `chore/release-X.Y.Z` PR bumping `package.json`/`package-lock.json` +
  `CHANGELOG.md`, then a `vX.Y.Z` GitHub Release, which triggers `release.yml` (full gate + publish
  to GitHub Packages). `package.json` can already hold an unreleased version a prior batch bumped.
- **Visual e2e baselines are Linux-runner-specific.** The committed `*-chromium-linux.png`
  snapshots are generated on the `ubuntu-24.04` runner via the `update-baselines` workflow
  (`gh workflow run update-baselines.yml --ref <branch>`); a local Windows/Docker render won't
  match. Never commit locally-generated baseline PNGs.
- **`GITHUB_TOKEN` pushes don't trigger workflows.** When the baseline bot commits to a PR branch,
  CI won't re-run — close/reopen the PR to re-trigger it.
