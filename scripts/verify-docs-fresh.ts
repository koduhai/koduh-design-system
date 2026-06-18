// Generated-docs freshness guard.
//
// The MCP snapshot (mcp/data/<version>/) and the docs-site pages/nav/playground
// controls are GENERATED from component sources + docs/FEATURES.md. If a prop,
// token, or description changes but the generators weren't re-run, the committed
// artifacts go stale. This guard re-runs the generators and fails if that would
// change any committed file — i.e. it proves the checked-in generated docs match
// the current source.
//
// It mirrors the real commit pipeline so it doesn't false-fail on cosmetics:
//   1. regenerate (mcp build:metadata + docs-site generate-pages)
//   2. prettier --write the JSON/TS outputs (lint-staged prettifies these on commit,
//      so the generators' raw output is never what actually lands)
//   3. `git diff --ignore-cr-at-eol` (CRLF on Windows checkouts is not real drift)
//
// Non-destructive: it restores the working tree afterward, and refuses to run if
// the generated paths already have uncommitted edits (so it can't clobber work in
// progress). Pairs with verify-docs-sync.ts; both run via `npm run verify:docs`.
// See docs/RELEASE.md.
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd: string) => execSync(cmd, { cwd: root, stdio: 'pipe' }).toString();

// Paths the two generators write. Kept in sync with the writeFileSync targets in
// mcp/scripts/build-metadata.ts and docs-site/scripts/generate-pages.ts.
const generatedPaths = [
  'mcp/data',
  'docs-site/src/pages/components',
  'docs-site/src/data/components.generated.ts',
  'docs-site/src/components/playground/controls.generated.ts',
];
// Subset prettier reformats on commit (.json/.ts — not .astro).
const prettierTargets = [
  'mcp/data/**/*.json',
  'docs-site/src/data/components.generated.ts',
  'docs-site/src/components/playground/controls.generated.ts',
];

const pathArgs = generatedPaths.map((p) => `"${p}"`).join(' ');

// Refuse to run (rather than wipe) if the dev already has uncommitted generated
// changes. CI always starts clean, so this only guards local runs.
const preexisting = run(`git status --porcelain -- ${pathArgs}`).trim();
if (preexisting) {
  console.log(
    '• Skipping freshness check: generated paths already have uncommitted changes.\n' +
      '  Commit or stash them first, then re-run. (Skipped, not failed.)',
  );
  process.exit(0);
}

function regenerate() {
  run('npx tsx mcp/scripts/build-metadata.ts');
  run('npx tsx docs-site/scripts/generate-pages.ts');
  run(`npx prettier --write ${prettierTargets.map((p) => `"${p}"`).join(' ')}`);
}

function restore() {
  run(`git checkout -- ${pathArgs}`);
}

try {
  regenerate();
} catch (e) {
  restore();
  console.error('✗ Could not regenerate docs artifacts:\n');
  console.error(
    (e as { stderr?: Buffer; message: string }).stderr?.toString() ?? (e as Error).message,
  );
  process.exit(1);
}

const drift = run(`git diff --ignore-cr-at-eol --name-only -- ${pathArgs}`).trim();
restore();

if (drift) {
  console.error('✗ Generated docs are stale — a source change was not regenerated:\n');
  for (const f of drift.split('\n')) console.error(`  - ${f}`);
  console.error(
    '\nRegenerate and commit:\n' +
      '  npx tsx mcp/scripts/build-metadata.ts\n' +
      '  npx tsx docs-site/scripts/generate-pages.ts\n' +
      '  (then `npm run format` and commit the changes)\n' +
      '\nSee docs/RELEASE.md.',
  );
  process.exit(1);
}

console.log('✓ Generated MCP snapshot + docs-site pages are in sync with current sources.');
