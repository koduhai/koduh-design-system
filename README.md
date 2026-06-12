<div align="center">

# @koduhai/design-system

**A dependency-free React component library with zero-runtime styling, dark-first theming, and accessibility built in.**

[![npm version](https://img.shields.io/npm/v/@koduhai/design-system.svg?color=6d4aff)](https://www.npmjs.com/package/@koduhai/design-system)
[![npm downloads](https://img.shields.io/npm/dm/@koduhai/design-system.svg?color=6d4aff)](https://www.npmjs.com/package/@koduhai/design-system)
[![CI](https://github.com/koduhai/koduh-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/koduhai/koduh-design-system/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/@koduhai/design-system.svg?color=3178c6)](https://www.npmjs.com/package/@koduhai/design-system)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Documentation](https://koduhai.github.io/koduh-design-system/) · [Components](#components) · [Quick start](#quick-start) · [Contributing](./CONTRIBUTING.md)

</div>

---

**81 accessible React components** built from scratch, with **no runtime dependencies**. No CSS-in-JS, no third-party component or styling library, no surprises. Design tokens compile to plain CSS custom properties and every component is a hashed CSS Module, so styling has zero runtime cost and themes switch with a single attribute.

## Why @koduhai/design-system?

- 🪶 **Zero runtime dependencies.** Just React (18 or 19) as a peer. Nothing ships to your users but the components you import.
- ⚡ **Zero-runtime styling.** Tokens become `--ku-*` CSS custom properties and components are CSS Modules. No style serialization at runtime, no flash of unstyled content.
- 🌗 **Dark-first theming.** Flip `data-theme` (or a `.dark`/`.light` class) and the whole system retunes. Tailwind `darkMode: 'class'` users get the tokens for free.
- ♿ **Accessibility is a hard requirement.** WCAG AA contrast, full keyboard support, and `prefers-reduced-motion` are verified with axe in **both** themes on every component.
- 🧩 **81 components**, from layout primitives to a full forms layer, a feature-rich `DataTable`, date and time pickers, and data-viz.
- 🎈 **Tiny and tree-shakeable.** ESM + CJS + `.d.ts`. Import one component and only that ships.
- 🛠️ **Built on the platform.** Overlays use the native `<dialog>`, the Popover API, and CSS anchor positioning (with a JS fallback), not a bundled positioning engine.
- 🔒 **Typed end to end.** Every public prop type is exported. Strict TypeScript throughout.

## Installation

```bash
npm install @koduhai/design-system
```

React is a peer dependency:

```bash
npm install react react-dom
```

## Quick start

Import the theme stylesheet once, wrap your app in the provider, and start composing:

```tsx
// main.tsx
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
        <Button tone="primary" onClick={() => alert('Hello')}>
          Get started
        </Button>
      </CardBody>
    </Card>
  );
}
```

## Theming

`KoduhThemeProvider` sets `data-theme` on `<html>`, persists the choice, and exposes a hook:

```tsx
import { useColorMode } from '@koduhai/design-system';

function ThemeToggle() {
  const { mode, toggleMode } = useColorMode();
  return <Button onClick={toggleMode}>Theme: {mode}</Button>;
}
```

Every color, space, radius, and type value is a `--ku-*` custom property, so you can read or override them from your own CSS with no build step.

**Server-rendered apps:** drop `<KoduhThemeScript />` in your document `<head>` to set the theme before first paint and avoid a flash of the wrong theme. See [`docs/ssr.md`](./docs/ssr.md).

**Tailwind users:** the [`@koduhai/design-system/tailwind-preset`](./docs/tailwind-consumer-compatibility.md) maps the tokens and brand ramp onto Tailwind so you can use `bg-primary`, `bg-brand-500`, and friends. A runnable example lives in [`examples/tailwind`](./examples/tailwind).

## Components

81 components across every layer of an app. Browse them live in [Storybook](https://koduhai.github.io/koduh-design-system/).

<details>
<summary><b>See all 81 components</b></summary>

| Category              | Components                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layout**            | `Box` `Stack` `Inline` `Grid` `Container` `AspectRatio` `Divider` `ScrollArea` `Collapsible`                                                                                               |
| **Typography**        | `Text` `Heading` `Link` `Code` `Kbd`                                                                                                                                                       |
| **Buttons & actions** | `Button` `LoadingButton` `ButtonGroup` `SplitButton` `ToggleGroup`                                                                                                                         |
| **Forms & inputs**    | `Form` `FormField` `TextField` `Textarea` `NumberField` `PasswordInput` `PinInput` `Select` `Combobox` `Checkbox` `Radio` `Switch` `Slider` `Rating` `TagInput` `ColorPicker` `FileUpload` |
| **Date & time**       | `Calendar` `DatePicker` `DateRangePicker` `TimePicker`                                                                                                                                     |
| **Overlays**          | `Dialog` `Drawer` `Popover` `Tooltip` `HoverCard` `Menu` `Popconfirm` `CommandPalette`                                                                                                     |
| **Feedback & status** | `Alert` `Banner` `Snackbar` `Toaster` `Progress` `Meter` `Spinner` `Skeleton` `EmptyState` `NotificationBadge` `StatusBadge`                                                               |
| **Data display**      | `Table` `DataTable` `Card` `DescriptionList` `Stat` `Avatar` `AvatarGroup` `Chip` `Timeline` `Tree` `Accordion` `Carousel`                                                                 |
| **Data viz**          | `Chart` `Sparkline` `CountUp`                                                                                                                                                              |
| **Navigation**        | `Tabs` `Breadcrumbs` `Pagination` `Sidebar` `AppBar` `Stepper` `PageHeader`                                                                                                                |

</details>

## Browser support

Modern evergreen browsers. Overlay positioning uses the Popover API and CSS anchor positioning, which are Chromium-first; on browsers without them the library falls back to JS positioning.

## Documentation

- 📖 **[Storybook](https://koduhai.github.io/koduh-design-system/)**: live component docs and playground.
- ♿ [`ACCESSIBILITY.md`](./ACCESSIBILITY.md): the per-component accessibility contract.
- 🧱 [`docs/component_guidelines.md`](./docs/component_guidelines.md): conventions and API patterns.
- 📝 [`CHANGELOG.md`](./CHANGELOG.md): release notes.

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, conventions, and the local gate to run before opening a pull request, and our [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). To report a security issue, see [`SECURITY.md`](./SECURITY.md).

If this project is useful to you, a ⭐ helps others find it.

## License

[MIT](./LICENSE) © Koduh AI
