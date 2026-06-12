# Contributing

Thanks for your interest in `@koduhai/design-system`. This guide covers the setup, conventions, and the checks to run before opening a pull request.

By participating you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md). To report a security issue, see [SECURITY.md](./SECURITY.md) (do not open a public issue for vulnerabilities).

## Prerequisites

- Node 20 (the CI runner uses Node 20; match it locally to avoid surprises).
- npm (the repo ships a `package-lock.json`; use `npm`, not yarn or pnpm).

## Setup

```bash
npm install
```

This library has **zero runtime dependencies**. React 18/19 are peer dependencies and are installed as dev dependencies for local work.

## Running things locally

```bash
npm run storybook     # component docs/playground at http://localhost:6006
npm test              # unit tests (Vitest + Testing Library, jsdom)
npm run test:watch    # unit tests in watch mode
npm run build         # build:tokens, then tsup -> dist (CJS + ESM + .d.ts)
npm run test:e2e      # Playwright + axe a11y against Storybook stories
```

`build` regenerates `dist/theme.css` from `src/theme/tokens.ts` first (the `build:tokens` step). `dist/theme.css` is generated and gitignored, so if Storybook or a test complains it is missing, run `npm run build:tokens` once.

## The local gate (run before every PR)

CI runs these in order on `main` PRs and a red gate blocks the merge. Run the same set locally first:

```bash
npm run typecheck        # tsc --noEmit (strict)
npm run lint             # eslint .
npm test                 # vitest run
npm run build            # build:tokens + tsup
npm run verify:bundle    # tree-shaking / sideEffects regression check
npm run verify:exports   # built export surface matches src/index.ts; CLAUDE.md component count is accurate
npm run test:e2e         # Playwright + axe (both dark and light themes, zero violations)
```

`npm run format` (Prettier) and the Husky `lint-staged` hook keep formatting consistent on commit.

## Branches and commits

- **Never commit directly to `main`.** It is branch-protected; all changes land via a PR.
- Branch naming: `<type>/<short-kebab-description>`, all lowercase. Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`, `build`. Examples: `feat/date-range-picker`, `fix/select-focus-trap`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <imperative summary>` (for example `fix: honor prefers-reduced-motion in Stepper`). Keep the subject short; use the body to explain why.
- Small, atomic commits: one logical change each.

## Component conventions

`src/components/Button/` is the reference implementation. The architecture is four layers (tokens -> primitives/utilities -> components -> provider/entry); each layer only depends on the ones below it, and no component reads another component's internals.

Each component lives in a self-contained folder `src/components/<Name>/`:

```
<Name>/
  <Name>.tsx
  <Name>.module.css
  <Name>.test.tsx
  <Name>.stories.tsx
  index.ts
```

Established patterns:

- **Variant styling via data-attributes, not class composition.** Set `data-variant`, `data-tone`, `data-size`, etc. on the root; the CSS Module selects on them (`.root[data-variant='solid']`).
- **`cx(styles.root, className)`** merges the scoped module class with a consumer-passed `className`, which is always forwarded to the root.
- **`forwardRef` + spread remaining DOM props** to the root so `aria-*`, `data-*`, `onClick`, `id`, etc. pass through. Props are explicit and typed; avoid opaque passthrough.
- **`asChild`** (via the `Slot` primitive) for polymorphism instead of an `as`/`component` prop.
- **Controlled/uncontrolled symmetry** via `useControllableState` for stateful components.
- Shared tone vocabulary for tonal components: `primary | neutral | success | warning | danger | info | accent`.
- Overlays with an `open` prop report close via `onOpenChange(open: boolean)` and take content as `children`.
- Icons accept any `ReactNode`; never force the in-house icon set on consumers.

See `docs/component_guidelines.md` for the details.

### Styling and tokens

- Styling is zero-runtime: design tokens compile to CSS custom properties (prefixed `--ku-`) and component styles are CSS Modules.
- To change a color, spacing value, radius, etc., edit `src/theme/tokens.ts` only. Never hand-edit `dist/theme.css` (it is generated and overwritten).

### Accessibility

- WCAG AA is a hard requirement. Color is never the only signal, and `prefers-reduced-motion` is honored.
- e2e tests run axe-core against Storybook stories in both dark and light themes with zero violations expected.

## Adding a component

1. Create `src/components/<Name>/` following the folder shape above (use `Button` as the template).
2. Export the component and every public prop type from its `index.ts`, then re-export from `src/index.ts` (`src/index.ts` is the source of truth for what ships).
3. Add a `<Name>.stories.tsx` so axe e2e covers it.
4. `npm run verify:exports` guards the export surface against `src/index.ts` and checks that the component count documented in `CLAUDE.md` is accurate, so update that count when you add or remove a component.
5. Run the full local gate above.

## Visual baselines

The visual regression baselines are **Linux-runner-specific** (`*-chromium-linux.png`), generated on the `ubuntu-24.04` runner. A local Windows/macOS render will not match, so **do not commit locally generated baseline PNGs**. When a visual change is intended, regenerate baselines via the `update-baselines` GitHub workflow:

```bash
gh workflow run update-baselines.yml --ref <your-branch>
```

## Pull requests

- PRs target `main` and need green CI (the full gate above) before merge.
- Fill out the PR template: summary, type of change, related issue (`Closes #n`), and the checklist.
- If your change is visual, include before/after screenshots.
