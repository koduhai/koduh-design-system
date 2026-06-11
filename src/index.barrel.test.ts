import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// Guards the convention "every public prop type exported from a component
// index.ts is re-exported from src/index.ts" (audit follow-up #67). verify-exports
// checks the built .d.ts against src/index.ts; this checks the source invariant a
// step earlier, so a new component export can't silently miss the package barrel.

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, 'components');
const rootIndex = join(here, 'index.ts');

/** Names exported by `export { ... }` / `export type { ... }` blocks (after `as`). */
function exportedNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const block of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const raw of block[1]!.split(',')) {
      const part = raw.trim();
      if (!part) continue;
      // `Foo as Bar` re-exports the name `Bar`; a bare `Foo` exports `Foo`.
      const name = part
        .split(/\s+as\s+/)
        .pop()!
        .trim();
      if (name) names.add(name);
    }
  }
  return names;
}

// A type may be exported by several component index.ts files (e.g. the shared
// SpaceToken / HeadingLevel) but only needs to reach the root barrel ONCE, under
// the same name. Comparing by name (union across all components) handles that, so
// no allowlist is needed; add one here only with a documented reason.
const ALLOWED_LOCAL_ONLY = new Set<string>();

describe('every component index.ts export is re-exported from src/index.ts', () => {
  const rootExports = exportedNames(readFileSync(rootIndex, 'utf8'));
  const componentDirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(componentsDir, name, 'index.ts')));

  it('scans the component folders', () => {
    expect(componentDirs.length).toBeGreaterThan(50);
  });

  for (const name of componentDirs) {
    it(`${name}: all public exports reach the package root`, () => {
      const local = exportedNames(readFileSync(join(componentsDir, name, 'index.ts'), 'utf8'));
      const missing = [...local].filter((n) => !rootExports.has(n) && !ALLOWED_LOCAL_ONLY.has(n));
      expect(missing).toEqual([]);
    });
  }
});
