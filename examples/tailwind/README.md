# Tailwind consumer example

A minimal Vite + React + TypeScript app that proves `@koduhai/design-system`
works end-to-end inside a TailwindCSS project, using the
`@koduhai/design-system/tailwind-preset` entry point.

## What it demonstrates

- **Semantic color tokens as Tailwind utilities.** The preset maps the design
  system's tokens onto Tailwind's palette as `var(--ku-*)` variables, so
  utilities like `bg-canvas`, `text-fg`, `bg-surface`, `border-border`,
  `bg-primary`, `text-success-fg`, `bg-accent`, etc. resolve to the tokens and
  stay theme-reactive.
- **The fixed brand tint ramp.** `bg-brand-50` through `bg-brand-900`
  (theme-independent by design, the same in dark and light).
- **Class-based dark/light theming.** A toggle flips the `.dark` / `.light`
  class on `<html>`. Because the build uses Tailwind `darkMode: 'class'` and the
  design system's `theme.css` emits its overrides under `.dark` / `.light` (as
  well as the `[data-theme]` attribute), one toggle re-themes both the Tailwind
  utilities and the design-system components.
- **Real components coexisting with Tailwind markup.** `<Button>` and `<Card>`
  (hashed CSS Modules) render next to Tailwind-styled elements without colliding.

> Alternative theming approach: instead of toggling the class directly you can
> wrap the app in `<KoduhThemeProvider>` and call `useColorMode()`, which drives
> the `[data-theme]` attribute. Both paths are supported; this example uses the
> class toggle because that is the Tailwind-native pattern.

## Prerequisites

This example consumes the **local** package via a `file:../..` dependency, not a
published one (the published package lives on GitHub Packages and requires
auth). So you must build the design system at the repo root **first**, so that
`dist/` (including the generated `dist/theme.css`) exists:

```bash
# from the repo root
npm install
npm run build
```

`npm run build` runs `build:tokens` (which generates `dist/theme.css`) and then
`tsup`, producing `dist/index.*`, `dist/styles.css`, `dist/theme.css`, and the
`dist/tailwind-preset/*` entry this example imports.

## Run

```bash
# from this directory (examples/tailwind)
npm install
npm run dev
```

Then open the URL Vite prints. Use the toggle in the top-right to flip between
light and dark.

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc --noEmit && vite build (production bundle)
npm run preview     # serve the production build
```

## Why `file:../..` (and not a Vite alias)?

`file:../..` installs the design system the way a real consumer would: npm reads
the repo's `package.json` `exports`, `sideEffects`, and subpath entries
(`/tailwind-preset`, `/theme.css`, `/styles.css`) from the built `dist/`. That
exercises the actual published surface, so if a subpath export or the preset
were misconfigured, this example would catch it. A Vite alias to `src/` would
bypass the build and the `exports` map, hiding exactly the kind of packaging
issue this example is meant to prove.

## See also

[`docs/tailwind-consumer-compatibility.md`](../../docs/tailwind-consumer-compatibility.md)
— the full assessment and adoption guide, including the preset's complete
utility-to-token table and the three integration seams.
