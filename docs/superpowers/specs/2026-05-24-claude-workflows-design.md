# Design: Claude maintainer workflows (slash commands + CLAUDE.md)

**Date:** 2026-05-24
**Status:** Approved (brainstorming)

## Context

The repo has only a lean `CLAUDE.md` and no reusable Claude workflow files. Two maintainer
activities recur and should be encoded so Claude runs them consistently:

1. **Ship an issue end-to-end** — pick an issue, implement it, merge, release, close it, and file
   follow-ups for anything unsolved. This mirrors the exact flow used for issue #12 → v2.4.0.
2. **Audit component consistency** — sweep all components for naming/convention drift across the
   design system.

Decisions (from brainstorming): **slash commands** (not skills); the audit **reports first, edits
only on approval**; **CLAUDE.md stays lean** with pointers to the command files.

## Files

- **Create** `.claude/commands/ship-issue.md` — the issue→release pipeline. Argument: an issue
  number (`$ARGUMENTS`).
- **Create** `.claude/commands/audit-components.md` — the read-only consistency audit.
- **Modify** `CLAUDE.md` — add a concise **Workflows** section pointing to both commands, and
  record two durable CI gotchas.

These are documentation/config (Markdown prompt files), not code — no tests/TDD apply.

## `/ship-issue <issue#>`

A prompt that orchestrates the proven pipeline. It does not re-implement the superpowers skills;
it sequences them and the release mechanics.

1. **Understand** — `gh issue view <#>`; restate scope; check `src/index.ts` for what already
   shipped (the umbrella issues bundle work that may be partly done).
2. **Implement** — if the issue is build work, follow superpowers (brainstorm → spec → plan) and
   build via parallel worktree subagents → octopus-merge → central integration. For docs/fixes,
   branch directly.
3. **Branch + gate** — never push to protected `main`; work on a feature branch; run the full
   local gate: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. **PR + visual baselines** — open a PR. Trigger the `update-baselines` workflow on the branch
   (`gh workflow run update-baselines.yml --ref <branch>`) because the local Windows render differs
   from the `ubuntu-24.04` runner. After the bot commits baselines, **close/reopen the PR** to
   re-trigger CI (pushes made with `GITHUB_TOKEN` do not fire workflows).
5. **Merge** — once CI is green (`gh pr checks`), squash-merge.
6. **Release** — decide the version with semver. Note: `package.json` may already hold an
   unreleased version (e.g. a prior batch bumped it without tagging) — account for that. Open a
   release branch bumping `package.json` + `package-lock.json` (only the two self-version spots,
   not coincidental dependency versions) + a new `CHANGELOG.md` section; PR → merge. Then create
   the `vX.Y.Z` tag + GitHub Release (`gh release create`), which triggers `release.yml` to run the
   gate and publish to GitHub Packages. **Confirm with the user before creating the Release** —
   publishing a package version is effectively irreversible.
7. **Close the issue** — `gh issue close <#>` with a comment linking the release and any follow-ups.
8. **File follow-ups** — for anything in the issue that wasn't solved, create new issues
   (`gh issue create`, label `enhancement`), grouped into coherent batches rather than many
   micro-issues. Use a checklist tracking issue for long P2-style backlogs.

## `/audit-components`

A prompt that sweeps `src/components/*` against the documented conventions and produces a report
**before** changing anything. Source of truth: `docs/component_guidelines.md`,
`docs/theme_specification.md`, and `CLAUDE.md`.

Checks:
- **Tone vocab** — tonal components use `primary | neutral | success | warning | danger`.
- **Size vocab** — `sm | md | lg` named consistently.
- **Variant styling** — via `data-*` attributes on the root, not class composition.
- **Prop conventions** — `forwardRef`, remaining DOM props spread to root, `cx(styles.root,
  className)`, `asChild` via `Slot` for polymorphism, DOM-collision props `Omit`-ted.
- **Overlay API** — `open` + `onOpenChange(open)` + `children` body for overlay components.
- **Collection pattern** — array-driven vs children-based per guidelines §8.
- **Exports** — every public prop type exported from the folder `index.ts` and re-exported from
  `src/index.ts`.
- **Folder shape** — `Name.tsx`, `Name.module.css`, `Name.test.tsx`, `Name.stories.tsx`,
  `index.ts` all present; a `Showcase` story exists and is registered in
  `e2e/components.spec.ts`.
- **Tokens** — components read `--ku-*` CSS vars; no hardcoded hex/px where a token exists; no
  runtime imports of `tokens.ts` values.
- **a11y / RTL** — color is never the only signal; `prefers-reduced-motion` honored; logical CSS
  properties used (post-#21).

Output: a per-component ✅/⚠️/❌ table plus a grouped findings list and a proposed fix plan. The
command **stops and asks for approval** before editing; mechanical fixes (export ordering, obvious
naming drift) and judgment calls are presented separately.

## CLAUDE.md changes

Add a short **Workflows** section:

> - `/ship-issue <n>` — pick up issue #n and take it through branch → PR → release → close →
>   follow-ups. See `.claude/commands/ship-issue.md`.
> - `/audit-components` — sweep all components for naming/convention consistency (reports first).
>   See `.claude/commands/audit-components.md`.

And two durable CI gotchas (in Build notes):
- Visual e2e baselines are Linux-runner-specific — regenerate via the `update-baselines` workflow,
  never commit Windows-generated PNGs.
- `main` is branch-protected; releases go through a version-bump PR, then a GitHub Release triggers
  publish. Pushes via `GITHUB_TOKEN` (e.g. the baseline bot) don't trigger CI — close/reopen the PR.

## Out of scope

- Converting these into auto-triggering Agent Skills (chose plain slash commands).
- Automating the release version decision (kept human-in-the-loop).
