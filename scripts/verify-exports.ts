// Release/docs drift guard (issue #6).
//
// v1.0.0 was published from a tag cut *before* DataTable was added to the public
// exports, so the released package shipped without the headline component while
// src/index.ts and CLAUDE.md claimed otherwise. This script fails the build when
// the working tree drifts from what a tagged build would actually ship:
//
//   1. Every named export in src/index.ts must appear in the built
//      dist/index.d.ts export surface (run `npm run build` first).
//   2. CLAUDE.md's "<N> components" claim must equal the real component count
//      exported from src/index.ts.
//
// Run via `npm run verify:exports` (wired into CI and the release workflow).
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

/** Pull identifiers out of every `export { ... }` / `export type { ... }` block. */
function namedExports(source: string): Set<string> {
  const names = new Set<string>();
  const blocks = source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g);
  for (const match of blocks) {
    const body = match[1];
    if (!body) continue;
    for (const raw of body.split(',')) {
      // Handle `type X`, `X as Y` (the exported name is what follows `as`).
      const token = raw.replace(/\btype\b/g, '').trim();
      if (!token) continue;
      const name = (token.includes(' as ') ? token.split(/\s+as\s+/)[1] : token)?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

const errors: string[] = [];

// --- 1. Built export surface matches the source entry ----------------------
const dtsPath = 'dist/index.d.ts';
if (!existsSync(resolve(root, dtsPath))) {
  errors.push(`${dtsPath} not found — run \`npm run build\` before verify:exports.`);
} else {
  const srcExports = namedExports(read('src/index.ts'));
  const builtExports = namedExports(read(dtsPath));
  const missing = [...srcExports].filter((n) => !builtExports.has(n));
  if (missing.length > 0) {
    errors.push(
      `These exports are declared in src/index.ts but missing from ${dtsPath} ` +
        `(the build would ship without them): ${missing.sort().join(', ')}`,
    );
  }
}

// --- 2. CLAUDE.md component count matches reality --------------------------
const indexSrc = read('src/index.ts');
const componentDirs = new Set(
  [...indexSrc.matchAll(/from '\.\/components\/([A-Za-z0-9]+)'/g)].map((m) => m[1]),
);
const actualCount = componentDirs.size;

const claudeMd = read('CLAUDE.md');
const claimMatch = claudeMd.match(/(\d+)\s+components/);
if (!claimMatch) {
  errors.push('Could not find an "<N> components" claim in CLAUDE.md to verify against.');
} else if (Number(claimMatch[1]) !== actualCount) {
  errors.push(
    `CLAUDE.md claims ${claimMatch[1]} components, but src/index.ts exports ${actualCount}. ` +
      `Update the count in CLAUDE.md (or the exports).`,
  );
}

if (errors.length > 0) {
  console.error('✗ Export/docs drift detected:\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ Export surface in sync (src/index.ts ↔ dist/index.d.ts) and CLAUDE.md ` +
    `component count = ${actualCount}.`,
);
