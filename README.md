# @koduhai/design-system (v1 — custom build)

Koduh AI's design system, rebuilt from scratch without Material UI. Dark-first
theme via CSS custom properties, zero-runtime CSS Modules styling, and a small
set of accessible primitives and icons.

> **Status:** Phase 0 (foundations) complete — tokens, primitives, icon set,
> theme provider, and the full build/test/Storybook pipeline are in place.
> Components are being added in Phases 1–4 (see `docs/superpowers/plans`).

## Develop

```bash
npm install
npm run storybook        # dev docs at http://localhost:6006
npm test                 # unit tests (Vitest)
npm run test:e2e         # a11y/visual e2e (Playwright + axe)
npm run build            # generate theme.css + bundle (tsup)
```

## Architecture

- `src/theme` — design tokens (single source of truth) → `dist/theme.css`
- `src/primitives` — `Slot`, `VisuallyHidden`, `useId`, `useControllableState`, ref/handler utils
- `src/icons` — vendored SVG icon set + `createIcon` factory
- `src/provider` — `KoduhThemeProvider` + `useColorMode`

See `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` for the full spec.
