// Docs-surface coverage guard.
//
// Every shipped component must be represented across all four documentation
// surfaces, so none silently lags the component library:
//
//   1. Storybook        — src/components/<Name>/<Name>.stories.tsx
//   2. Docs site demo    — docs-site/src/components/demos/<Name>Demo.tsx
//   3. Docs site page    — docs-site/src/pages/components/<slug>.astro
//   4. MCP snapshot      — an entry in mcp/data/<package.json version>/components.json
//
// It also checks the MCP snapshot for the *current* package.json version exists
// and that its component set matches src/index.ts exactly (no missing, no stale).
//
// This is the structural half of the pre-release docs audit. The freshness half
// (did generated artifacts get re-run after a prop/token change?) lives in
// verify-docs-fresh.ts. Both run via `npm run verify:docs` (wired into CI and the
// release workflow). See docs/RELEASE.md.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');
const has = (p: string) => existsSync(resolve(root, p));

/** camelCase/PascalCase -> kebab-case. MUST match the slug logic in
 *  docs-site/scripts/generate-pages.ts and mcp/scripts/build-metadata.ts so the
 *  page filename we look for is the one the generator actually wrote. */
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

// --- shipped component set (the source of truth) ---------------------------
// Same enumeration as verify-exports.ts: the directory each component re-exports
// from in src/index.ts.
const indexSrc = read('src/index.ts');
const components = [
  ...new Set(
    [...indexSrc.matchAll(/from '\.\/components\/([A-Za-z0-9]+)'/g)]
      .map((m) => m[1])
      .filter((n): n is string => Boolean(n)),
  ),
].sort();

const version = (JSON.parse(read('package.json')) as { version: string }).version;
const errors: string[] = [];

// --- MCP snapshot for the current version ----------------------------------
const snapshotPath = `mcp/data/${version}/components.json`;
let mcpNames = new Set<string>();
if (!has(snapshotPath)) {
  errors.push(
    `MCP snapshot ${snapshotPath} is missing — run \`cd mcp && npm run build:metadata\` ` +
      `(it keys off package.json version ${version}).`,
  );
} else {
  const snap = JSON.parse(read(snapshotPath)) as { components: { name: string }[] };
  mcpNames = new Set(snap.components.map((c) => c.name));
}

// --- per-component surface coverage ----------------------------------------
const noStory: string[] = [];
const noDemo: string[] = [];
const noPage: string[] = [];
const noMcp: string[] = [];

for (const name of components) {
  const slug = kebab(name);
  if (!has(`src/components/${name}/${name}.stories.tsx`)) noStory.push(name);
  if (!has(`docs-site/src/components/demos/${name}Demo.tsx`)) noDemo.push(name);
  if (!has(`docs-site/src/pages/components/${slug}.astro`)) noPage.push(name);
  if (mcpNames.size && !mcpNames.has(name)) noMcp.push(name);
}

const surfaces: [label: string, names: string[]][] = [
  ['Storybook story', noStory],
  ['docs-site demo', noDemo],
  ['docs-site page', noPage],
  ['MCP snapshot entry', noMcp],
];
for (const [surface, names] of surfaces) {
  if (names.length) {
    errors.push(`${names.length} component(s) missing a ${surface}: ${names.join(', ')}`);
  }
}

// --- stale MCP entries (a component was removed/renamed but the snapshot kept it)
if (mcpNames.size) {
  const shipped = new Set(components);
  const stale = [...mcpNames].filter((n) => !shipped.has(n)).sort();
  if (stale.length) {
    errors.push(
      `MCP snapshot v${version} lists ${stale.length} component(s) no longer in src/index.ts: ` +
        `${stale.join(', ')} — re-run \`cd mcp && npm run build:metadata\`.`,
    );
  }
}

if (errors.length > 0) {
  console.error('✗ Docs-surface drift detected:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nSee docs/RELEASE.md for how to add the missing surface(s).');
  process.exit(1);
}

console.log(
  `✓ All ${components.length} components covered across Storybook, docs-site demos + pages, ` +
    `and the v${version} MCP snapshot.`,
);
