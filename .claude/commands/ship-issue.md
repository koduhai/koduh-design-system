---
description: Take a GitHub issue end-to-end — implement, PR, merge, release, close, and file follow-ups.
argument-hint: <issue-number>
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, AskUserQuestion, Skill
---

# Ship issue #$ARGUMENTS

Take issue **#$ARGUMENTS** all the way from triage to a published release, following this repo's
proven pipeline (the one used for #12 → v2.4.0). Do not skip the superpowers process for build
work, and confirm before any irreversible publish step.

## 1. Understand the issue
- `gh issue view $ARGUMENTS --repo koduhai/koduhai-design-system-v2`
- Restate the scope in your own words. If it's an **umbrella/roadmap** issue, check `src/index.ts`
  and the closed issues to see what already shipped — only do the unshipped part.
- Decide: is this **build work** (new/changed components) or a **docs/fix**?

## 2. Implement
- **Build work:** use the superpowers flow — `superpowers:brainstorming` → spec → `superpowers:writing-plans`.
  Then build with the parallel-subagent workflow: dispatch one `Agent` per independent component
  in `isolation: "worktree"`, octopus-merge their branches, then do the central integration
  (wire `src/index.ts`, register `Showcase` stories in `e2e/components.spec.ts`).
  - Worktree gotcha: agent commits may need `--no-verify` (the husky pre-commit hook can fail to
    spawn on Windows); have the agent run `npx lint-staged` manually first. After merging, unlock
    and remove the worktrees (`git worktree unlock` → `git worktree remove --force`) and delete the
    `worktree-agent-*` branches, or `npm run lint` breaks on duplicate tsconfig roots.
- **Docs/fix:** branch directly and make the change.
- Never push to `main` (branch-protected). Create a feature branch: `git checkout -b <type>/<slug>`.

## 3. Local gate (must be green before PR)
```
npm test
npm run typecheck
npm run lint
npm run build
```

## 4. PR + Linux visual baselines
- `git push -u origin <branch>` and `gh pr create` with a Summary + Test Plan, `Refs #$ARGUMENTS`.
- Visual e2e baselines are **Linux-runner-specific** — the local Windows render differs. Trigger:
  `gh workflow run update-baselines.yml --ref <branch>`. Watch it (`gh run watch`); it commits
  `*-chromium-linux.png` back to the branch.
- That bot push uses `GITHUB_TOKEN`, which **does not trigger CI**. Re-trigger by closing and
  reopening the PR: `gh pr close <#>` then `gh pr reopen <#>`. Then `git pull` to sync local.
- Watch CI to green: `gh pr checks <#>`.

## 5. Merge
- Once CI is green: `gh pr merge <#> --squash --delete-branch`. Sync `main`.

## 6. Release  (confirm before publishing)
- Decide the version (semver: features → minor, fixes → patch). **Check `package.json` first** —
  a prior batch may have already bumped it without tagging/publishing; account for that.
- Branch `chore/release-X.Y.Z`: bump `package.json` + `package-lock.json` (only the two
  self-version spots — line ~3 and the `packages."".version`; ignore coincidental dependency
  versions) and add a new `## [X.Y.Z]` section to `CHANGELOG.md`.
- PR → CI green → `gh pr merge --squash --delete-branch`. Sync `main`.
- **Ask the user to confirm** (publishing is effectively irreversible), then:
  `gh release create vX.Y.Z --target main --title "vX.Y.Z" --notes "<release notes from CHANGELOG>"`.
  This triggers `release.yml` (full gate + publish to GitHub Packages). Watch it to success.

## 7. Close the issue
- `gh issue close $ARGUMENTS` with a comment summarizing what shipped, the release version, and
  links to any follow-up issues.

## 8. File follow-ups
- For anything in the issue that wasn't solved, `gh issue create --label enhancement`, grouped into
  **coherent batches** (match the repo's style — see #27–#32), not many micro-issues. Use a single
  checklist tracking issue for long P2-style backlogs.

## Report
End with: branch/PR links, release URL + publish-workflow conclusion, the closed issue, and the new
issue numbers.
