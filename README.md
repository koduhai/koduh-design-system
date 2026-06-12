# @koduhai/design-system

[![npm version](https://img.shields.io/npm/v/@koduhai/design-system.svg)](https://www.npmjs.com/package/@koduhai/design-system)
[![CI](https://github.com/koduhai/koduh-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/koduhai/koduh-design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A from-scratch React component library with **zero runtime dependencies** and no
Material UI, Emotion, or other third-party component/styling library. Styling is
zero-runtime: design tokens compile to CSS custom properties and component styles
are CSS Modules. Dark-first theming, 80+ accessible components, and WCAG AA as a
hard requirement.

## Features

- **80+ components** across layout, typography, forms, overlays, data display,
  navigation, and feedback.
- **Zero runtime dependencies.** React 18 and 19 are peer dependencies.
- **Zero-runtime styling.** Tokens compile to `--ku-*` CSS custom properties;
  components ship as hashed CSS Modules. No runtime CSS-in-JS.
- **Dark-first theming** via a `data-theme` attribute, with a `.dark`/`.light`
  class fallback so Tailwind `darkMode: 'class'` consumers get the tokens for free.
- **Accessibility built in.** WCAG AA verified, color is never the only signal,
  `prefers-reduced-motion` is honored, and every component is axe-tested in both
  themes.
- **Platform primitives, no heavy deps.** Overlays use the native `<dialog>`,
  the Popover API, and CSS anchor positioning (with a JS fallback where those
  are not yet supported).
- **Typed, tree-shakeable** ESM + CJS builds with `.d.ts` types.

## Installation

```bash
npm install @koduhai/design-system
```

React is a peer dependency, so install it too if you have not already:

```bash
npm install react react-dom
```

## Quick start

Import the theme stylesheet once at your app entry, wrap your tree in
`KoduhThemeProvider`, and use components:

```tsx
// app entry (e.g. main.tsx)
import '@koduhai/design-system/theme.css';
import { KoduhThemeProvider } from '@koduhai/design-system';

export function Root() {
  return (
    <KoduhThemeProvider defaultMode="dark">
      <App />
    </KoduhThemeProvider>
  );
}
```

```tsx
import { Button, Card, CardBody } from '@koduhai/design-system';

export function App() {
  return (
    <Card>
      <CardBody>
        <Button tone="primary" onClick={() => alert('Hi')}>
          Get started
        </Button>
      </CardBody>
    </Card>
  );
}
```

## Theming

`KoduhThemeProvider` sets `data-theme` on `<html>`, persists the choice to
`localStorage`, and exposes a `useColorMode()` hook:

```tsx
import { useColorMode } from '@koduhai/design-system';

function ThemeToggle() {
  const { mode, toggleMode } = useColorMode();
  return <button onClick={toggleMode}>Theme: {mode}</button>;
}
```

All colors, spacing, radii, and typography are CSS custom properties prefixed
`--ku-`, so you can read or override them in your own CSS.

### SSR / no-flash

On server-rendered pages, the provider applies `data-theme` after hydration,
which can flash the wrong theme on first paint. Drop `KoduhThemeScript` into your
document `<head>` to set the theme synchronously before paint:

```tsx
import { KoduhThemeScript } from '@koduhai/design-system';
// ...
<head>
  <KoduhThemeScript defaultMode="dark" />
</head>;
```

See [`docs/ssr.md`](./docs/ssr.md) for Next.js and Remix usage.

### Tailwind

A `@koduhai/design-system/tailwind-preset` entry maps the semantic color tokens
and brand ramp onto Tailwind's theme as `var(--ku-*)` values, so you can use
utilities like `bg-primary` or `bg-brand-500` alongside the components. See
[`docs/tailwind-consumer-compatibility.md`](./docs/tailwind-consumer-compatibility.md)
and the runnable [`examples/tailwind`](./examples/tailwind) app.

## Browser support

Modern evergreen browsers. Overlay positioning uses the Popover API and CSS
anchor positioning, which are Chromium-first; on browsers without them the
library falls back to JS positioning.

## Documentation

- Component docs and live playground: run `npm run storybook`.
- [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) - the per-component a11y contract.
- [`docs/component_guidelines.md`](./docs/component_guidelines.md) - conventions and API patterns.
- [`CHANGELOG.md`](./CHANGELOG.md) - release notes.

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup,
conventions, and the local gate to run before opening a pull request, and
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). To report a security issue, see
[`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE) (c) Koduh AI.
