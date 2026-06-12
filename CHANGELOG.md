# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-12

First public release. `@koduhai/design-system` is a from-scratch React component
library with zero runtime dependencies and no Material UI, Emotion, or other
third-party component/styling library. Styling is zero-runtime: design tokens
compile to CSS custom properties and component styles are CSS Modules. WCAG AA is
a hard requirement, verified with axe in both themes.

### Highlights

- **81 components** spanning layout and typography primitives, forms, overlays,
  data display, navigation, and feedback.
- **Theming.** `KoduhThemeProvider` sets `data-theme`, persists the choice, and
  exposes `useColorMode()`. All design values are `--ku-*` CSS custom properties.
  Dark/light overrides apply under both `[data-theme]` and a `.dark`/`.light`
  class, so Tailwind `darkMode: 'class'` consumers get the tokens for free; a
  `@koduhai/design-system/tailwind-preset` entry maps the tokens and brand ramp
  onto Tailwind.
- **SSR no-flash.** `KoduhThemeScript` sets the theme synchronously before first
  paint for server-rendered apps (Next.js, Remix).
- **Forms.** A `FormField`-led layer with a `Form`/`useForm` orchestration layer
  (values, validation via a Standard-Schema resolver, field arrays, error
  summary).
- **Data.** `DataTable` with sorting, filtering, selection, sticky header, column
  resize, row expansion, server-side hooks, and opt-in row virtualization
  (including a measure-based path that combines with row expansion). Plus
  `Sparkline`/`Chart` data-viz and a `Calendar`/`DatePicker` date and time layer.
- **Overlays without heavy dependencies.** Dialog/Popover/Tooltip/Select/Menu and
  friends are built on platform primitives (native `<dialog>`, the Popover API,
  and CSS anchor positioning) with a JS positioning fallback.
- **i18n.** A central message catalog (`KoduhI18nProvider`, `useMessages()`) with
  English defaults; per-component string props still win.
- **Build.** Tree-shakeable ESM + CJS bundles with `.d.ts` types. React 18 and 19
  are peer dependencies; there are no runtime dependencies.
