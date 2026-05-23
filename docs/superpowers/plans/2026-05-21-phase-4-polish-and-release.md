# Phase 4 — Polish & Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (this phase is sequential and shares files across tasks — NOT a parallel-subagent phase). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take `@koduhai/design-system` from "all 12 components built" to a verified, releasable v1.0.0: prove the bundle tree-shakes, document the accessibility audit, close the CI visual-regression gap with Linux baselines, and prepare (but not trigger) the v1.0.0 publish.

**Architecture:** No new components. This phase adds (1) a tree-shaking/bundle verification script, (2) an `ACCESSIBILITY.md` audit doc, (3) Docker-generated Linux visual baselines + a CI visual job, and (4) release artifacts (version bump, `CHANGELOG.md`, a publish-on-release workflow). Tasks are sequential and touch shared/root files, so they run inline in one session (no parallel agents).

**Tech Stack:** Node + esbuild (already a tsup transitive dep) for bundle checks; Docker (official Playwright image) for Linux baselines; GitHub Actions for CI + release.

**User-confirmed decisions:**

- **CI visual snapshots:** generate Linux baselines via the official Playwright Docker image, commit ONLY the `*-linux.png` set, and add a visual job to CI.
- **Release:** full prep — bump to `1.0.0`, write `CHANGELOG.md`, add a publish-on-GitHub-Release workflow targeting `npm.pkg.github.com`. The actual publish/tag/push is done by the user (no git remote or npm auth in this environment).

**Reference spec:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` (§15 Phase 4; §9 a11y; §11 build).

---

## Current state (verified before this phase)

- All 12 components built and exported from `src/index.ts`. 108 unit tests, `typecheck`/`lint`/`format` clean, `build` succeeds.
- e2e: 26 axe tests pass (12 components × 2 themes + foundations), 24 visual tests pass against **win32** baselines (gitignored).
- `package.json`: `version` `1.0.0-alpha.0`, `sideEffects: ["**/*.css"]`, `publishConfig.registry` `https://npm.pkg.github.com`, `files: ["dist"]`.
- CI (`.github/workflows/ci.yml`): runs typecheck/lint/test/build + axe e2e only; visual excluded.
- `e2e/.gitignore` ignores `*-snapshots/` entirely.

---

## Task 1: Tree-shaking & bundle verification

**Files:**

- Create: `scripts/verify-bundle.mjs`
- Modify: `package.json` (add `verify:bundle` script)

- [ ] **Step 1: Write the verification script** — `scripts/verify-bundle.mjs`

```js
// Verifies the ESM build tree-shakes: bundling a single-component import must
// NOT pull in unrelated components. Uses esbuild (a tsup dependency).
import { build } from 'esbuild';
import { writeFileSync, mkdtempSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distEsm = join(root, 'dist', 'index.mjs');

// Markers that appear ONLY in components other than Button.
const FORBIDDEN = [
  'Collapse sidebar', // Sidebar
  'sidebar-list', // Sidebar useId prefix
  'textfield', // TextField useId prefix
  'Breadcrumb', // PageHeader nav aria-label
];

const dir = mkdtempSync(join(tmpdir(), 'ku-treeshake-'));
const entry = join(dir, 'entry.mjs');
writeFileSync(entry, `import { Button } from ${JSON.stringify(distEsm)};\nconsole.log(Button);\n`);

const out = join(dir, 'out.mjs');
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: out,
  logLevel: 'silent',
});

const code = (await import('node:fs/promises')).then;
const bundled = (await import('node:fs')).readFileSync(out, 'utf8');
const leaked = FORBIDDEN.filter((m) => bundled.includes(m));

const raw = statSync(out).size;
const gz = gzipSync(bundled).length;
console.log(`Button-only bundle: ${raw} B raw, ${gz} B gzip`);

if (leaked.length > 0) {
  console.error(`✗ Tree-shaking FAILED — leaked markers: ${leaked.join(', ')}`);
  process.exit(1);
}
console.log('✓ Tree-shaking OK — unused components excluded from a Button-only import.');
```

> Note: the `code`/`then` line above is dead — remove it; the working read is the `bundled` line. (Kept minimal: read `out` with `readFileSync`.) If esbuild's import resolution complains about the absolute path on Windows, pass `absWorkingDir: dir`.

- [ ] **Step 2: Clean up the script** — remove the dead `const code = ...` line so only the `bundled` read remains. Final read block:

```js
import { readFileSync, writeFileSync, mkdtempSync, statSync } from 'node:fs';
// ...
const bundled = readFileSync(out, 'utf8');
```

(Consolidate the `node:fs` imports at the top; delete the inline dynamic `import('node:fs')`.)

- [ ] **Step 3: Add the npm script** — in `package.json` `scripts`, add:

```json
    "verify:bundle": "node scripts/verify-bundle.mjs",
```

- [ ] **Step 4: Build then run the verification**

Run:

```bash
npm run build
npm run verify:bundle
```

Expected: prints the Button-only bundle size and `✓ Tree-shaking OK`. If it FAILS, do not patch the script to pass — investigate `sideEffects`/exports (a real tree-shaking regression).

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-bundle.mjs package.json
git commit -m "test: add tree-shaking + bundle-size verification"
```

---

## Task 2: Accessibility audit document

**Files:**

- Create: `ACCESSIBILITY.md`

- [ ] **Step 1: Write `ACCESSIBILITY.md`** capturing the audit. Use this structure with real, current facts (do not invent results — reflect the passing axe suite and the per-component a11y measures actually implemented):

```markdown
# Accessibility

`@koduhai/design-system` targets **WCAG 2.1 AA** as a hard requirement.

## Automated coverage

- **axe-core** runs against every component's Showcase story in **both dark and
  light themes** via Playwright (`e2e/components.spec.ts`) — currently **zero
  violations** across all 12 components plus the icon gallery.
- Document-structure rules that don't apply to isolated story fragments
  (`landmark-one-main`, `page-has-heading-one`, `region`) are disabled per-test
  with documented justification; component-level rules (contrast, names, roles,
  landmark uniqueness) are always enforced.
- Type safety (`tsc --noEmit`) and unit tests assert ARIA wiring
  (`aria-describedby`, `aria-current`, `aria-expanded`, `aria-invalid`, roles).

## Principles enforced

- **Color is never the only signal.** StatusBadge pairs color with a text label
  and dot; Alert pairs color with an icon and role; the Sidebar active item uses
  high-contrast text + a primary accent bar + weight (not color alone).
- **Visible focus.** `reset.css` provides a `:focus-visible` ring; no component
  removes outlines without replacement.
- **Reduced motion.** `prefers-reduced-motion` is honored in the reset; the only
  animation (LoadingButton spinner) is decorative and `aria-hidden`.
- **Keyboard operable.** All interactive elements are native `<button>`/`<a>`/
  `<input>` (or `asChild` preserving roles); nothing relies on pointer-only.

## Per-component notes

| Component              | Key a11y measures                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button / LoadingButton | native `<button>`; `asChild` keeps link role; `aria-busy` + disabled while loading; SR-only loading text                                                                          |
| Chip                   | clickable chip is a `<button>`; delete affordance is a labeled button                                                                                                             |
| Avatar                 | `alt` on image; initials get `aria-label`                                                                                                                                         |
| StatusBadge            | text label always present; color + dot are secondary                                                                                                                              |
| Alert                  | `role="alert"` (error/warning) or `role="status"` (info/success); labeled close                                                                                                   |
| TextField              | label↔input via `useId`; helper/error via `aria-describedby`; `aria-invalid`; `required`                                                                                          |
| Card                   | semantic container; heading structure left to consumer                                                                                                                            |
| EmptyState             | configurable heading level; decorative icon `aria-hidden`                                                                                                                         |
| PageHeader             | `<header>`; configurable heading level; breadcrumbs in `<nav aria-label="Breadcrumb">`                                                                                            |
| AppBar                 | `<header>` banner landmark; keyboard-reachable actions                                                                                                                            |
| Sidebar                | `<nav>` landmark; labeled collapse toggle (`aria-expanded`/`aria-controls`); active item `aria-current="page"`; collapsed labels remain in the a11y tree (clip, not display:none) |

## Known limitations / out of scope

- No overlay components (Dialog, Snackbar, Tooltip) — so no focus-trap/portal
  concerns. If added later, focus management must be designed in.
- Visual contrast is verified by axe on the Showcase stories; bespoke
  consumer color overrides are the consumer's responsibility.
```

- [ ] **Step 2: Commit**

```bash
git add ACCESSIBILITY.md
git commit -m "docs: add accessibility audit (ACCESSIBILITY.md)"
```

---

## Task 3: Linux visual baselines + CI visual gate

**Files:**

- Modify: `e2e/.gitignore`
- Add (generated): `e2e/components.spec.ts-snapshots/*-linux.png`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Track only Linux baselines** — replace `e2e/.gitignore` contents with:

```gitignore
# Visual-regression baselines are platform-specific. We commit ONLY the Linux
# baselines (*-linux.png) so the CI ubuntu runner can diff against them. Local
# baselines for other OSes (e.g. *-win32.png) stay ignored to avoid churn.
# Regenerate Linux baselines with the Playwright Docker image:
#   docker run --rm -v "$PWD:/work" -v /work/node_modules -w /work \
#     mcr.microsoft.com/playwright:vX.Y.Z-jammy \
#     bash -c "npm ci && npx playwright test --grep visual --update-snapshots"
*-snapshots/*
!*-snapshots/*-linux.png
```

- [ ] **Step 2: Generate the Linux baselines via Docker**

Run (Bash; the image tag is pinned to the installed Playwright version, and an anonymous volume on `/work/node_modules` keeps the host's Windows `node_modules` untouched):

```bash
PW_VERSION=$(node -p "require('@playwright/test/package.json').version")
docker run --rm \
  -v "$(pwd):/work" -v /work/node_modules \
  -w /work \
  "mcr.microsoft.com/playwright:v${PW_VERSION}-jammy" \
  bash -c "npm ci && npx playwright test --grep visual --update-snapshots"
```

Expected: 24 visual tests run inside the container (Storybook auto-starts via the webServer config; `prestorybook` regenerates `dist/theme.css`), writing `e2e/components.spec.ts-snapshots/*-chromium-linux.png` for all 12 components × 2 themes.

> If the container can't reach `localhost:6006`, the webServer is bound correctly by Playwright inside the container's own network namespace — no host networking needed since both Storybook and the test run in the same container. If npm ci is slow, that's the one-time cost.

- [ ] **Step 3: Confirm the Linux baselines are now tracked**

Run: `git status --short e2e/` and `git check-ignore e2e/components.spec.ts-snapshots/components-button--showcase-dark-chromium-linux.png`
Expected: the `*-linux.png` files appear as untracked/added (NOT ignored); `check-ignore` prints nothing for a `-linux.png` path but DOES match a `-win32.png` path.

- [ ] **Step 4: Add a visual job to CI** — in `.github/workflows/ci.yml`, replace the single `E2E a11y tests` step with both an axe step and a visual step (the visual step diffs against the committed Linux baselines):

```yaml
- name: E2E a11y tests (axe, both themes)
  run: npm run test:e2e -- --grep axe

# Visual regression against the committed Linux baselines. Runs on the same
# ubuntu image the baselines were generated on (Playwright Docker / jammy).
- name: E2E visual regression
  run: npm run test:e2e -- --grep visual

- name: Upload Playwright report on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

> The GitHub `ubuntu-latest` runner and the `playwright:*-jammy` image are both Debian/Ubuntu glibc + the same pinned Chromium, so rendering matches. The existing `toHaveScreenshot: { maxDiffPixelRatio: 0.01 }` tolerance in `playwright.config.ts` absorbs sub-pixel AA differences.

- [ ] **Step 5: Sanity-check the visual suite locally still passes (win32, against local baselines)**

Run: `npm run test:e2e -- --grep visual`
Expected: 24 pass against the local `*-win32.png` baselines (still present, still gitignored). This confirms Step 1's gitignore change didn't disturb local runs.

- [ ] **Step 6: Commit (Linux baselines + CI + gitignore)**

```bash
git add e2e/.gitignore .github/workflows/ci.yml "e2e/components.spec.ts-snapshots"
git commit -m "ci: add visual regression gate with committed Linux baselines"
```

---

## Task 4: Release preparation (v1.0.0)

**Files:**

- Modify: `package.json` (version)
- Create: `CHANGELOG.md`
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Bump the version** — in `package.json`, change `"version": "1.0.0-alpha.0"` to `"version": "1.0.0"`.

- [ ] **Step 2: Write `CHANGELOG.md`** (Keep a Changelog format):

```markdown
# Changelog

All notable changes to `@koduhai/design-system` are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-22

First stable release of the from-scratch, MUI-free design system.

### Added

- **Foundations:** design tokens compiled to CSS custom properties
  (`--ku-*`), `reset.css`, `KoduhThemeProvider` + `useColorMode`, a vendored
  SVG icon set (`createIcon`), and primitives (`Slot`/`asChild`, `mergeRefs`,
  `composeEventHandlers`, `useId`, `useControllableState`, `VisuallyHidden`).
- **12 components:** Button, LoadingButton, Chip, Avatar, StatusBadge, Alert,
  TextField, Card, EmptyState, PageHeader, AppBar, Sidebar.
- Zero-runtime CSS Modules styling; CJS + ESM + `.d.ts` builds via tsup.
- WCAG 2.1 AA: axe-core a11y tests on every component in both themes (zero
  violations) and visual-regression baselines.

### Notes

- No runtime dependencies; React 18/19 are peer dependencies.
- Clean break from the v0.x MUI wrapper — see `MIGRATION.md`.
```

- [ ] **Step 3: Add the publish-on-release workflow** — `.github/workflows/release.yml`:

```yaml
# Publishes the package to GitHub Packages when a GitHub Release is published.
# Trigger: create a Release in the GitHub UI (tag like v1.0.0). This builds,
# runs the gates, and publishes — the maintainer controls the trigger.
name: Release

on:
  release:
    types: [published]

permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          registry-url: https://npm.pkg.github.com

      - name: Install dependencies
        run: npm ci

      - name: Verify gates
        run: |
          npm run typecheck
          npm run lint
          npm test
          npm run build
          npm run verify:bundle

      - name: Publish to GitHub Packages
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 4: Confirm the package is publish-ready (dry run, no actual publish)**

Run:

```bash
npm run build
npm pack --dry-run
```

Expected: `npm pack --dry-run` lists ONLY `dist/**` (+ package.json, README, LICENSE, CHANGELOG per npm defaults) — confirms `files: ["dist"]` keeps source/tests/stories out of the tarball. Note the reported package size.

> Do NOT run `npm publish`. Publishing + tagging + pushing is the maintainer's step (no git remote / npm auth here).

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md .github/workflows/release.yml
git commit -m "chore: prepare v1.0.0 release (version, changelog, publish workflow)"
```

---

## Task 5: Final verification gate + README

**Files:**

- Modify: `README.md` (status block → all phases complete)

- [ ] **Step 1: Update the README status block** to state all four phases are complete and the system is at v1.0.0, releasable. Remove the "Phase 4 remains" line.

- [ ] **Step 2: Run the COMPLETE gate**

```bash
npm run typecheck      # PASS
npm run lint           # PASS
npm run format:check   # PASS
npm test               # PASS (108)
npm run build          # PASS
npm run verify:bundle  # ✓ Tree-shaking OK
npm run test:e2e       # axe (26) + visual (24) PASS locally
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mark all phases complete; v1.0.0 ready"
```

---

## Self-Review Notes (spec coverage)

- **§15 Phase 4** → migration guide already exists (`MIGRATION.md`, prior commit); docs rewrite done; **bundle/tree-shaking verification** (Task 1); **full a11y audit** (Task 2, backed by the passing axe suite); **v1.0.0 release via existing CI** (Task 4 prep + Task 3 CI hardening).
- **Audit gap #5 (visual snapshots not in CI)** → closed by Task 3 (Linux baselines + CI visual job).
- **Outward-facing safety** → no publish/tag/push performed by the agent; release is fully prepared and gated behind a maintainer-triggered GitHub Release.

**Deferred / maintainer actions (not done by the agent):** create the git remote, push `main`, create the `v1.0.0` GitHub Release to trigger publish.
