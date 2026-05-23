# @koduhai/design-system (v1 — custom build)

Koduh AI's design system, rebuilt from scratch without Material UI. Dark-first
theme via CSS custom properties, zero-runtime CSS Modules styling, and a small
set of accessible primitives and icons.

> **Status:** Phase 0 (foundations) and Phase 1 (the six simple components —
> `Button`, `LoadingButton`, `Chip`, `Avatar`, `StatusBadge`, `Alert`) are
> complete. Tokens, primitives, icon set, theme provider, and the
> build/test/Storybook pipeline are in place. Phases 2–4 remain (see
> `docs/superpowers/plans`).

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

## Avoiding a theme flash (SSR / static hosting)

`KoduhThemeProvider` applies the `data-theme` attribute in a `useEffect`, which
only runs after React mounts on the client. If your page is server-rendered or
statically pre-rendered, the initial HTML paints before that effect runs, so a
visitor whose persisted mode differs from the markup's default can see one frame
of the wrong theme before hydration ("flash of wrong theme"). Pure client-side
apps (e.g. a plain Vite/CRA SPA) are unaffected, since nothing is painted before
React runs.

The fix is a tiny blocking inline `<script>` in the document `<head>` that reads
the same persisted value and sets `data-theme` _before_ first paint. It must use
the same defaults as the provider — localStorage key `koduh-color-mode`,
fallback `'dark'`, attribute `data-theme` on `document.documentElement`:

```html
<script>
  (function () {
    try {
      var mode = localStorage.getItem('koduh-color-mode');
      if (mode !== 'dark' && mode !== 'light') mode = 'dark';
      document.documentElement.setAttribute('data-theme', mode);
    } catch (e) {}
  })();
</script>
```

Next.js users can add this via `next/script` with
`strategy="beforeInteractive"`, or inline it in the `<head>` of a custom
`_document` / root layout.

See `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` for the full spec.
