# `@koduhai/design-system` — Features

Snapshot of the current `main` surface (**81 components**), published as
**v1.0.0** on the public npm registry (first public release, 2026-06-12). Zero
runtime dependencies, WCAG 2.1 AA enforced via axe-core in both dark and light
themes. Source of truth for the public surface is `src/index.ts`.

The 1.0.0 surface includes `Select` multi-select (#81), a full i18n string
sweep (#79), the date/time layer (#42/#61 — `TimePicker`, `Calendar` range
mode, `DateRangePicker`, `DatePicker` date+time), and opt-in `DataTable` row
virtualization (#37).

---

## Components (81)

### Actions

- `Button` — solid/outline/ghost variants × shared tone vocab × `asChild`. `src/components/Button/Button.tsx`
- `LoadingButton` — `Button` + `loading` + `aria-busy`. `src/components/LoadingButton/LoadingButton.tsx`
- `ButtonGroup` — segmented attached cluster sharing one border (#43). `src/components/ButtonGroup/ButtonGroup.tsx`
- `SplitButton` — primary action + attached dropdown menu (#43). `src/components/SplitButton/SplitButton.tsx`
- `ToggleGroup` — single/multi roving-focus segmented selector (#12). `src/components/ToggleGroup/ToggleGroup.tsx`

### Form controls

- `TextField` — labelled text input, density-aware, `FormField`-composing. `src/components/TextField/TextField.tsx`
- `PasswordInput` — labelled password input with show/hide toggle (#tailwind). `src/components/PasswordInput/PasswordInput.tsx`
- `Textarea` — `autoResize`, density. `src/components/Textarea/Textarea.tsx`
- `NumberField` — steppers + `min`/`max`/`step`, reports `null` on empty. `src/components/NumberField/NumberField.tsx`
- `PinInput` — fixed-length one-time-code input. `src/components/PinInput/PinInput.tsx`
- `Checkbox` (+ `indeterminate`). `src/components/Checkbox/Checkbox.tsx`
- `Radio` + `RadioGroup`. `src/components/Radio/Radio.tsx`
- `Switch`. `src/components/Switch/Switch.tsx`
- `Select` — `options`-driven, `clearable`, `required`, single or `multiple` (chips, #81). `src/components/Select/Select.tsx`
- `Combobox` — searchable, `clearable`, single or `multiple`, async/loading + create-option (#39). `src/components/Combobox/Combobox.tsx`
- `TagInput` — chip-rendering token input. `src/components/TagInput/TagInput.tsx`
- `Slider` — WAI-ARIA slider, density. `src/components/Slider/Slider.tsx`
- `Rating` — keyboard-operable star rating (#32). `src/components/Rating/Rating.tsx`
- `FileUpload` — drag-and-drop dropzone (#32). `src/components/FileUpload/FileUpload.tsx`
- `ColorPicker` — saturation/value + hue + alpha + hex + swatch (#43). `src/components/ColorPicker/ColorPicker.tsx`
- `DatePicker` — input + popover calendar; `granularity='minute'` adds a time field for date+time (#27/#61). `src/components/DatePicker/DatePicker.tsx`
- `DateRangePicker` — two-field range input over the range calendar (#42). `src/components/DateRangePicker/DateRangePicker.tsx`
- `TimePicker` — segmented hour/minute(/second) spinbuttons, 12/24h, `FormField`-composing (#42). `src/components/TimePicker/TimePicker.tsx`
- `Calendar` — standalone month grid, full keyboard nav, single or `mode='range'` (#27/#42). `src/components/Calendar/Calendar.tsx`
- `FormField` (+ `useField`, `useFieldContext`, `useOptionalFieldContext`) — label/required/`aria-*` wiring. `src/components/FormField/FormField.tsx`
- `Form` (+ `useForm`, `useFormContext`, `useFormField`, `useFieldArray`, `FormErrorSummary`, `standardSchemaResolver`) — headless form store with per-field subscriptions, Standard Schema validation, focus-on-error (#38). `src/components/Form/`

### Data display & feedback

- `Chip` — variants × tones, optional delete, `ReactNode` label. `src/components/Chip/Chip.tsx`
- `Avatar` — image + initials fallback, sizes/shapes. `src/components/Avatar/Avatar.tsx`
- `AvatarGroup` — stacked overlapping avatars + `+N` overflow (#12). `src/components/AvatarGroup/AvatarGroup.tsx`
- `StatusBadge` — text + dot + color (never color-only). `src/components/StatusBadge/StatusBadge.tsx`
- `NotificationBadge` — count/dot overlay anchored to a child (#43). `src/components/NotificationBadge/NotificationBadge.tsx`
- `Alert` — `role="alert"`/`role="status"`, `dismissable`. `src/components/Alert/Alert.tsx`
- `Banner` — page-level notice (info/success/warning/danger) (#43). `src/components/Banner/Banner.tsx`
- `Card` (+ `CardHeader` / `CardBody` / `CardFooter` slots). `src/components/Card/Card.tsx`
- `EmptyState`. `src/components/EmptyState/EmptyState.tsx`
- `Progress` — bar with shared tone vocab. `src/components/Progress/Progress.tsx`
- `Meter` — `role="meter"` measurement gauge with threshold tones (#43). `src/components/Meter/Meter.tsx`
- `Spinner` — tone subset, sizes. `src/components/Spinner/Spinner.tsx`
- `Skeleton` — variants for text/circle/rect, dark-aware. `src/components/Skeleton/Skeleton.tsx`
- `Stat` — dashboard metric block with `trend`/`delta` + arrow + SR direction text (#12). `src/components/Stat/Stat.tsx`
- `CountUp` — animated count-up to target, honors reduced motion (#tailwind). `src/components/CountUp/CountUp.tsx`
- `Sparkline` — line/area/bar microchart (#28). `src/components/Sparkline/Sparkline.tsx`
- `Chart` — minimal line/bar chart with categorical palette tokens (#28). `src/components/Chart/Chart.tsx`
- `Table` — sortable headers, multi-column sort, `selectAllIds`. `src/components/Table/Table.tsx`
- `DataTable` — stateful Table orchestrator: pagination, search, per-column filters, row selection, row expansion, column resize, server-side `manual` hook, opt-in row virtualization (#9/#30/#37). `src/components/DataTable/DataTable.tsx`
- `DescriptionList` — `<dl>` key-value primitive. `src/components/DescriptionList/DescriptionList.tsx`
- `Tree` — keyboard-navigable tree (#32). `src/components/Tree/Tree.tsx`
- `Timeline` — vertical/horizontal event list (#32). `src/components/Timeline/Timeline.tsx`
- `Code` + `CodeBlock` — inline + block code surfaces (#32). `src/components/Code/Code.tsx`
- `Kbd` — keyboard-key chip (#32). `src/components/Kbd/Kbd.tsx`

### Overlays & floating

- `Dialog` + `ConfirmDialog` — native `<dialog>` + `showModal()`, `initialFocus`, pending/loading confirm, warning tone (#57). `src/components/Dialog/Dialog.tsx`
- `Drawer` — edge slide-in built on `<dialog>` (#12). `src/components/Drawer/Drawer.tsx`
- `Snackbar` — controlled primitive (transient feedback). `src/components/Snackbar/Snackbar.tsx`
- `Toaster` + `useToast()` — singleton FIFO toast region; `toast.promise()`; per-toast id/placement; multi-`<Toaster>` (#14/#18). `src/components/Toaster/Toaster.tsx`
- `Popover` — Popover API + CSS anchor positioning, JS fallback. `src/components/Popover/Popover.tsx`
- `Popconfirm` — inline confirmation popover (#43). `src/components/Popconfirm/Popconfirm.tsx`
- `HoverCard` — hover-triggered floating card (#32). `src/components/HoverCard/HoverCard.tsx`
- `Tooltip`. `src/components/Tooltip/Tooltip.tsx`
- `Menu` — array-driven items with separators. `src/components/Menu/Menu.tsx`
- `CommandPalette` — searchable command launcher (#32). `src/components/CommandPalette/CommandPalette.tsx`

### Navigation

- `AppBar` — top bar with `position`. `src/components/AppBar/AppBar.tsx`
- `Sidebar` — `items`-driven, `collapseBelow` matchMedia auto-collapse (#22). `src/components/Sidebar/Sidebar.tsx`
- `Breadcrumbs`. `src/components/Breadcrumbs/Breadcrumbs.tsx`
- `Tabs` — `lazy` + `keepMounted` panel content (#31). `src/components/Tabs/Tabs.tsx`
- `Pagination` (+ exported `getPaginationRange`). `src/components/Pagination/Pagination.tsx`
- `Stepper` — vertical/horizontal step progress (#32). `src/components/Stepper/Stepper.tsx`
- `PageHeader` — title + breadcrumbs + actions, `BreadcrumbItem[]` accepted. `src/components/PageHeader/PageHeader.tsx`
- `Link` — defaults to `underline="always"` for in-text use. `src/components/Link/Link.tsx`

### Layout & primitives

- `Stack` — flex column, responsive `gap`/`align`/`justify` (#13). `src/components/Stack/Stack.tsx`
- `Inline` — flex row, responsive props (#13). `src/components/Inline/Inline.tsx`
- `Grid` — `columns` or `minItemWidth` auto-fit + track ratios (#19). `src/components/Grid/Grid.tsx`
- `Container` — max-width + padding, `py`. `src/components/Container/Container.tsx`
- `Box` — curated layout escape hatch (`padding`/`grow`/`minWidth`/`as`). `src/components/Box/Box.tsx`
- `Accordion` — `lazy` + `keepMounted`. `src/components/Accordion/Accordion.tsx`
- `Collapsible` — single expandable region (#32). `src/components/Collapsible/Collapsible.tsx`
- `ScrollArea` — styled scroll viewport, horizontal/vertical (#32). `src/components/ScrollArea/ScrollArea.tsx`
- `Carousel` — keyboard-paginated slide carousel (#32). `src/components/Carousel/Carousel.tsx`
- `AspectRatio` — fixed-ratio wrapper (#32). `src/components/AspectRatio/AspectRatio.tsx`
- `Divider`. `src/components/Divider/Divider.tsx`

### Typography

- `Text` — `size`/`weight`/`tone` (typographic axis: `default`/`secondary`) × `family`/`numeric`/`transform`/`leading`/`truncate`/`lineClamp`. `src/components/Text/Text.tsx`
- `Heading` — semantic `level` decoupled from visual `size`. `src/components/Heading/Heading.tsx`

---

## Theming & Color

- **Single source of truth:** `src/theme/tokens.ts` — theme-independent scales in `tokens`, theme-varying color in `themes`.
- **Token pipeline:** `scripts/generate-theme-css.ts` emits `dist/theme.css` as `--ku-*` CSS custom properties (e.g. `--ku-font-size-md`, `--ku-color-bg-default`). Generated file is gitignored.
- **Dark + light themes**, with a fixed brand tint ramp `--ku-brand-50 … --ku-brand-900` anchored on `#1B5FCC`. `src/theme/tokens.ts`
- **Status fg tokens:** `--ku-color-{success,warning,danger,info}-fg`, AA-contrast-verified in `src/theme/contrast.test.ts`.
- **Categorical chart palette:** `--ku-color-chart-1 … -8`, per-theme.
- **Class-based theming:** overrides apply under both `[data-theme]` and a `.dark` / `.light` class so Tailwind `darkMode: 'class'` works. `dist/theme.css`
- **`KoduhThemeProvider`** — sets `data-theme` on `<html>`, persists to `localStorage` (`koduh-color-mode`), exposes `useColorMode()` with `mode`/`preference`/`setMode`/`toggleMode`/`cycleMode`. Supports `'system'` preference following `prefers-color-scheme`. `src/provider/KoduhThemeProvider.tsx`
- **Tone vocabulary (shared):** `primary | neutral | success | warning | danger | info | accent` (`Button`/`Chip`/`Progress`/`ToggleGroup`).

## Typography & Spacing

- **Font families:** `--ku-font-family-base` (Inter) and `--ku-font-family-mono` (JetBrains Mono).
- **`fontSize`:** `xs` 12 / `sm` 14 / `md` 16 / `lg` 20 / `xl` 24 / `2xl` 32 — exposed as `--ku-font-size-*`. `src/theme/tokens.ts`
- **`fontWeight`:** `regular`/`medium`/`semibold`/`bold`.
- **`lineHeight`:** `tight`/`base`/`relaxed`.
- **`space`:** integer scale `1`–`12` (px multiples of 4) — `--ku-space-*`.
- **`radius`:** `sm`/`md`/`lg`/`full`.
- **`shadow`:** elevations 1/2/3.
- **`breakpoint`:** `sm` 600 / `md` 900 / `lg` 1200 / `xl` 1536 — used by responsive layout props on `Grid`/`Stack`/`Inline` (`{ base, md, … }`).
- **`duration`/`easing`:** `fast` 120ms / `base` 200ms / `standard` cubic-bezier — components honor `prefers-reduced-motion`.
- **Density modes:** `comfortable` (default) / `compact` via `[data-density]` and `--ku-density-*` vars. `density` prop on `Table`, `TextField`, `Select`, `Menu`. `density` map + `Density` type exported. `src/theme/tokens.ts`

## Icons

- **`createIcon`** factory — vendored SVG icon set, tree-shakeable (`/* @__PURE__ */` annotated). `src/icons/createIcon.tsx`
- **25 bundled icons:** `CloseIcon`, `ChevronUp/Down/Left/RightIcon`, `CheckIcon`, `InfoIcon`, `WarningIcon`, `ErrorIcon`, `MenuIcon`, `SearchIcon`, `UserIcon`, `HomeIcon`, `DashboardIcon`, `ListIcon`, `ActivityIcon`, `ChartIcon`, `BotIcon`, `SettingsIcon`, `BellIcon`, `PlusIcon`, `MoreVerticalIcon`, `LogOutIcon`, `EyeIcon`, `EyeOffIcon`. `src/icons/icons.tsx`
- **Bring-your-own icons:** every component that accepts an icon takes any `ReactNode` — no in-house set is forced. See `docs/icon_guidelines.md`.

## Hooks & Utilities

- **Provider hook:** `useColorMode()` — `mode`/`preference`/`setMode`/`toggleMode`/`cycleMode`. `src/provider/useColorMode.ts`
- **Notification hook:** `useToast()` — module-singleton store, works anywhere without a provider; `toast.promise(p, ...)`. `src/components/Toaster/`
- **Field/form hooks:** `useField`, `useFieldContext`, `useOptionalFieldContext`, `useFieldControlProps`, `useForm`, `useFormContext`, `useOptionalFormContext`, `useFormField`, `useFieldArray`, `standardSchemaResolver`. `src/components/FormField/`, `src/components/Form/`
- **i18n:** `KoduhI18nProvider` + `useMessages()` / `useLocale()` + typed `Messages` catalog (`defaultMessages`, `mergeMessages`) — translate every built-in string and pin an `Intl` locale; per-component string props still win (#41/#79). `src/i18n/`
- **Live-region announcer:** `<LiveRegion>` (declarative) + `useAnnouncer()` / `announce()` (imperative, SSR-safe) (#40). `src/primitives/`
- **Pagination:** `getPaginationRange` exported alongside `Pagination`. `src/components/Pagination/`
- **Primitives:** `Slot`, `VisuallyHidden`, `LiveRegion`, `useAnnouncer`, `announce`, `mergeRefs`, `composeEventHandlers`, `useId`, `useControllableState`. `src/primitives/`
- **`cx`** — class-name join utility. `src/utils/cx.ts`

## Build & Distribution

- **Package:** `@koduhai/design-system@1.0.0` on the public npm registry. `package.json`
- **Peer deps:** `react ^18 || ^19`, `react-dom ^18 || ^19`. **Zero runtime deps.**
- **Dual ESM + CJS + `.d.ts`** via `tsup`. `tsup.config.ts`
- **Entry points (`package.json` `exports`):**
  - `.` → main component + primitive surface
  - `./theme` → `tokens`/`themes`/`density` + types
  - `./icons` → `createIcon` + bundled set
  - `./tailwind-preset` → Tailwind colors preset (semantic + brand ramp) as `var(--ku-*)`
  - `./styles.css` → reset + focus ring
  - `./theme.css` → generated CSS custom properties
- **CSS handling:** tsup `loader: { '.css': 'local-css' }` — `*.module.css` classes hashed; `reset.css` stays global. `sideEffects` lists only `**/*.css`.
- **Tree-shaking verified** via `npm run verify:bundle` (`/* @__PURE__ */` factories). `scripts/verify-bundle.ts`
- **Exports-surface guard:** `npm run verify:exports` fails the build when `dist/index.d.ts` diverges from `src/index.ts` or when CLAUDE.md's component count is wrong. `scripts/verify-exports.ts`
- **Release flow:** maintainer cuts a `chore/release-X.Y.Z` PR + GitHub Release, `.github/workflows/release.yml` publishes. Branch-protected `main`; baselines are Linux-runner-specific (regenerated via `update-baselines.yml`).

## Testing & Storybook

- **Vitest** (jsdom) unit + behavior tests colocated as `*.test.ts(x)`. `npm test`
- **Playwright + axe-core** a11y/visual-regression e2e against Storybook stories in **both** dark and light themes — zero violations gate. `e2e/foundations.spec.ts`, `e2e/components.spec.ts`
- **Visual-regression baselines** in `e2e/components.spec.ts-snapshots` — Linux-runner-specific PNGs; do not commit locally generated ones.
- **Storybook 10** (`@storybook/react-vite`) — every component ships a `<Name>.stories.tsx`, plus `Colors.stories.tsx`, `Spacing.stories.tsx`, `Typography.stories.tsx`, `Icons.stories.tsx`. `.storybook/main.ts`
- **`@storybook/addon-a11y`** runs axe in the Storybook UI.
- **Type-check** as a separate CI gate: `npm run typecheck`.

## Documentation

- `README.md` — quickstart, theme-flash SSR snippet, architecture map.
- `CHANGELOG.md` — Keep-a-Changelog, SemVer, history back to 1.0.0.
- `MIGRATION.md` — v1→v2 migration plus per-batch notes.
- `ACCESSIBILITY.md` — per-component a11y guarantees.
- `docs/design_system_overview.md` — top-of-house architecture narrative.
- `docs/component_guidelines.md` — naming/convention rules, variant-via-`data-*`, tone vocab, exception list (`Toaster`/`Code`/`LoadingButton`/`Text` typographic tone).
- `docs/theme_specification.md` — token taxonomy + `--ku-*` mapping rules.
- `docs/icon_guidelines.md` — `createIcon` factory + SVG conventions.
- `docs/storybook_guide.md` — story layout, Showcase story convention.
- `docs/tailwind-consumer-compatibility.md` — Tailwind preset adoption guide.
- `docs/superpowers/{specs,plans}/` — historical design specs and execution plans, per phase / per issue batch.
- **Storybook** is the canonical component reference — run `npm run storybook` (no public hosted URL yet).

## Documentation site (`docs-site/`) & MCP (`mcp/`)

Two new top-level workspaces consume the library (not published; not yet committed):

- **`docs-site/`** — an Astro documentation site, Spectrum-style. React components render as islands. Every one of the 81 components has a generated page with a description, a prop table, an import snippet, **live interactive demos** (authored from each `*.stories.tsx`), and an **interactive props playground** (edit props with live controls, watch the preview update, copy the generated JSX). Pages, sidebar nav, the components index, and the playground control specs are all generated from `docs/FEATURES.md` + the component sources by `docs-site/scripts/generate-pages.ts`. Theming reuses the library's own `--ku-*` variables and the dark-first toggle. `npm run build` from `docs-site/` produces a static site (`base: /koduh-design-system` for GitHub Pages).
- **`mcp/`** — a version-pinned Model Context Protocol server (stdio). `scripts/build-metadata.ts` snapshots component props (via the TS compiler API) and design tokens into `mcp/data/<version>/`; `src/server.ts` exposes tools `list_versions`, `list_components`, `get_component`, `get_tokens`, and `search` (each takes an optional `version`, defaulting to latest) plus per-component resources. Lets an AI assistant query docs that match the exact installed version. See `mcp/README.md`.
