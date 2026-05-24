---
description: Audit all components for naming/convention consistency across the design system. Reports first; edits only on approval.
argument-hint: "[component name, or blank for all]"
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion, Edit
---

# Component consistency audit

Sweep the design system for naming and convention drift. **Produce a report first — do not edit
any code until the user approves a fix plan.**

Scope: `$ARGUMENTS` if a component name is given, otherwise every folder under `src/components/*`.

Source of truth for the conventions: `CLAUDE.md`, `docs/component_guidelines.md`, and
`docs/theme_specification.md`. Read those first so the audit reflects the current rules, not
assumptions.

## What to check (per component)

1. **Tone vocabulary** — tonal components expose exactly `primary | neutral | success | warning |
   danger`. Flag extra/missing/renamed tones, and any tone type that diverges from the shared set.
2. **Size vocabulary** — sizes named `sm | md | lg` consistently (flag `small/medium/large`,
   `xs`-only outliers, or inconsistent `*Size` type names).
3. **Variant styling** — variants/tones/sizes selected via `data-*` attributes on the root in the
   `.module.css` (e.g. `.root[data-variant='solid']`), **not** class composition.
4. **Prop conventions** — `forwardRef`; remaining DOM props spread to the root; `className`
   forwarded via `cx(styles.root, className)`; `asChild` (via `Slot`) for polymorphism; DOM-name
   collisions (`title`, `onChange`, …) `Omit`-ted from the extended `HTMLAttributes`.
5. **Overlay API** — overlay components (`open` prop) report via `onOpenChange(open: boolean)` and
   take body as `children`. Flag bespoke `onClose`-only overlays (except `Alert`, which is
   intentionally fire-and-forget).
6. **Collection pattern** — array-driven (`items`/`options`) when the component owns item markup +
   a11y; `children`-based when each item is a standalone control. Flag mismatches vs. guidelines §8.
7. **Exports** — every public prop/type is exported from the folder `index.ts` **and** re-exported
   from `src/index.ts`. Flag missing re-exports.
8. **Folder shape** — `Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`,
   `index.ts` all present. A `Showcase` story exists and is registered in the `COMPONENTS` array in
   `e2e/components.spec.ts`.
9. **Tokens** — styles read `--ku-*` CSS variables; no hardcoded hex colors or raw px where a token
   exists; no runtime import of values from `theme/tokens.ts`. Cross-check var names against the
   generated set (`npm run build:tokens` then grep `dist/theme.css`) so the audit doesn't flag
   valid vars or miss invented ones.
10. **a11y / RTL** — color is never the only signal (icon/text accompanies status color);
    `prefers-reduced-motion` respected for animations; **logical** CSS properties
    (`margin-inline-*`, `inset-inline-*`, etc.) rather than physical left/right (post-#21).

## Output

1. A summary table: one row per component, a ✅ / ⚠️ / ❌ per check category.
2. A grouped findings list, ordered by severity:
   - **❌ Inconsistencies** — real drift (wrong tone name, missing export, physical CSS in a
     component that should be logical).
   - **⚠️ Smells** — judgment calls worth a look (unusual prop shape, missing `Showcase`).
3. A proposed **fix plan**, splitting **mechanical fixes** (safe, e.g. export ordering / obvious
   rename) from **judgment fixes** (need a decision).

Then **stop and ask** which fixes to apply (use `AskUserQuestion`). Apply only what's approved, run
`npm run typecheck && npm run lint && npm test` after, and report results. If the fixes are broad,
land them on a branch + PR rather than directly on `main` (branch-protected).
