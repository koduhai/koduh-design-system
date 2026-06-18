# Release & deprecation process

How `@koduhai/design-system` is versioned, released, and how APIs are deprecated
and removed. The companion guards that enforce the docs side of this are
`verify:exports`, `verify:docs-sync`, and `verify:docs-fresh` (see
[Pre-release docs audit](#pre-release-docs-audit)).

## Versioning

The package follows [Semantic Versioning](https://semver.org):

- **patch** (`x.y.Z`) — bug fixes, internal changes, doc-only changes. No API change.
- **minor** (`x.Y.0`) — additive, backward-compatible: new components, new optional
  props, new exports. A consumer upgrading must not have to change code.
- **major** (`X.0.0`) — a breaking change: a removed/renamed export or prop, a
  changed default that alters rendered output, or a changed prop type that no
  longer accepts a previously valid value.

`1.0.0` is the first public release on the public npm registry. (Earlier `2.x`
numbers in the git history were an internal GitHub Packages prerelease line, not
public releases — see `CHANGELOG.md`.)

The published artifact is whatever `package.json` says, so **`package.json` is the
source of truth for the version**. The MCP metadata snapshot in `mcp/data/<version>/`
keys off it.

## Release process

`main` is **branch-protected**: every change, including releases, lands via a PR.
Never push to `main` directly.

1. **Branch:** `chore/release-X.Y.Z` off an up-to-date `main`.
2. **Bump the version** in `package.json` and `package-lock.json` (`npm version
--no-git-tag-version X.Y.Z` does both).
3. **Regenerate the version-pinned MCP snapshot** so a new `mcp/data/X.Y.Z/`
   directory is created for the release (the snapshot is keyed by version):
   ```bash
   cd mcp && npm run build:metadata && cd ..
   npm run format        # prettier the generated JSON (matches the commit pipeline)
   ```
4. **Update `CHANGELOG.md`:** add an `## [X.Y.Z] - YYYY-MM-DD` section. List
   additions, fixes, and any **Deprecated** / **Removed** entries (see
   [Deprecation process](#deprecation-process)).
5. **Run the full gate locally** before opening the PR:
   ```bash
   npm run typecheck && npm run lint && npm test && npm run build \
     && npm run verify:bundle && npm run verify:exports && npm run verify:docs
   ```
6. **Visual baselines** — if any _visible_ change landed since the last release,
   regenerate the Linux-runner baselines first (they are runner-specific and a
   local render won't match):
   `gh workflow run update-baselines.yml --ref chore/release-X.Y.Z`, wait for the
   bot to commit, then `git pull`. Do this _before_ CI runs so it passes first try.
   (`GITHUB_TOKEN` pushes don't re-trigger CI — close/reopen the PR if needed.)
7. **Open the PR**, let CI pass, merge.
8. **Publish:** create a GitHub Release with tag `vX.Y.Z` (must exactly match
   `package.json`). That triggers `.github/workflows/release.yml`, which re-runs the
   full gate + e2e and publishes to npm via trusted publishing (OIDC, no token).
   Pre-releases (`vX.Y.Z-rc.1`) are never published.

## Pre-release docs audit

Every component change should land **with** its documentation surfaces updated in
the same PR, not as a later catch-up. Three things must move together with a
component:

| Surface          | Where                                                                                                         | How it updates                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Storybook**    | `src/components/<Name>/<Name>.stories.tsx`                                                                    | hand-authored — add/adjust the story                         |
| **Docs site**    | `docs-site/src/components/demos/<Name>Demo.tsx` (demo) + `docs-site/src/pages/components/<slug>.astro` (page) | demo is hand-authored; page/nav/playground are **generated** |
| **MCP snapshot** | `mcp/data/<version>/`                                                                                         | **generated**                                                |

Regenerate the generated artifacts after any prop, token, or `docs/FEATURES.md`
change:

```bash
npx tsx mcp/scripts/build-metadata.ts        # MCP snapshot
npx tsx docs-site/scripts/generate-pages.ts  # docs-site pages, nav, playground controls
npm run format                               # prettier the generated JSON/TS
```

Two guards enforce this; both run in CI on every PR and again in the release
workflow, and you can run them locally with **`npm run verify:docs`**:

- **`verify:docs-sync`** (structural) — fails if any shipped component (from
  `src/index.ts`) is missing a Storybook story, a docs-site demo, a docs-site page,
  or an MCP snapshot entry, or if the MCP snapshot for the current `package.json`
  version is missing or lists a component that no longer exists.
- **`verify:docs-fresh`** (freshness) — re-runs both generators, prettifies the
  output the way the commit pipeline does, and fails if that changes any committed
  file. In other words: it fails when a prop/token/description change was made but
  the generators were not re-run. It is non-destructive (restores the working tree)
  and skips itself if the generated paths already have uncommitted edits.

`verify:exports` additionally guards that the built `dist/index.d.ts` matches
`src/index.ts` and that `CLAUDE.md`'s component count is accurate.

> Note: Storybook stories are hand-authored, so the guard enforces that a story
> _exists_ for each component, not that its content reflects the latest props.
> Reviewing the story is part of the PR, not something a script can verify.

## Deprecation process

Public API is removed only in a **major** release, and only after a deprecation
period. The steps:

1. **Mark it** with a JSDoc `@deprecated` tag naming the replacement, so the
   warning shows up in consumers' editors and in the generated docs/MCP prop tables:
   ```ts
   /** @deprecated Use `tone` instead. Removed in the next major. */
   color?: Tone;
   ```
2. **Keep it working.** A deprecated prop/component stays functional for **at least
   one minor release** — deprecating is additive and ships in a minor, never a patch.
3. **Document it** under a `### Deprecated` heading in that release's `CHANGELOG.md`
   entry, with the replacement and the intended removal version.
4. **Provide the path forward.** If the replacement isn't a drop-in, add before/after
   notes to `docs/MIGRATION.md` (create it if absent).
5. **Regenerate docs** so the `@deprecated` tag flows into the docs site and MCP
   snapshot (`npm run verify:docs` will flag it if you forget).
6. **Remove** in the next **major** release: delete the API, drop the `@deprecated`
   member, note it under `### Removed` in `CHANGELOG.md`, and finalize the
   `MIGRATION.md` section.

Deprecating an entire component follows the same path: `@deprecated` on the
component's props interface and a `CHANGELOG` **Deprecated** entry, keep it exported
through at least the next minor, remove in a major.

See also the **Release & CI gotchas** section of `CLAUDE.md`.
