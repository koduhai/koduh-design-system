import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { buildThemeCss } from './generate-theme-css';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '../src');

/** Recursively collect files under `src/` whose name matches `pred`. */
function collectFiles(dir: string, pred: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, pred));
    else if (entry.isFile() && pred(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Extract the set of `--ku-*` custom-property names declared by the generated
 * theme CSS (i.e. the names the pipeline actually emits). Matches declarations
 * (`--ku-foo:`), not `var()` reads.
 */
function emittedTokenNames(css: string): Set<string> {
  const names = new Set<string>();
  for (const m of css.matchAll(/(--ku-[a-z0-9-]+)\s*:/g)) {
    if (m[1]) names.add(m[1]);
  }
  return names;
}

/**
 * Every `var(--ku-*)` read in a CSS file, with whether it carries a fallback
 * (a comma after the name). A reference with a fallback degrades gracefully if
 * the token is absent; one without a fallback silently renders nothing when the
 * token is never emitted, which is the drift this guard catches.
 */
function tokenReads(css: string): { name: string; hasFallback: boolean }[] {
  const reads: { name: string; hasFallback: boolean }[] = [];
  for (const m of css.matchAll(/var\(\s*(--ku-[a-z0-9-]+)\s*([,)])/g)) {
    if (m[1]) reads.push({ name: m[1], hasFallback: m[2] === ',' });
  }
  return reads;
}

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('declares scale variables on :root', () => {
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toContain('--ku-space-1: 4px;');
    expect(css).toContain('--ku-radius-md:');
  });

  it('declares dark theme as the default on :root and [data-theme="dark"]', () => {
    expect(css).toContain('--ku-color-bg-default: #0A0E1A;');
    expect(css).toMatch(/\[data-theme="dark"\]/);
  });

  it('declares light theme overrides under [data-theme="light"]', () => {
    expect(css).toMatch(/\[data-theme="light"\][^{]*\{[^}]*--ku-color-bg-default: #FFFFFF;/s);
  });

  it('also honors the .dark / .light class strategy (Tailwind darkMode:"class")', () => {
    // Dark overrides apply under a `.dark` class, sharing the data-theme rule.
    expect(css).toMatch(
      /\[data-theme="dark"\][^{]*\.dark\s*\{[^}]*--ku-color-bg-default: #0A0E1A;/s,
    );
    // Light overrides apply under a `.light` class so a class-strategy app can
    // reach the light palette without relying on the dark-by-default :root.
    expect(css).toMatch(
      /\[data-theme="light"\][^{]*\.light\s*\{[^}]*--ku-color-bg-default: #FFFFFF;/s,
    );
  });

  it('converts camelCase token names to kebab-case variables', () => {
    expect(css).toContain('--ku-color-text-primary:');
    expect(css).toContain('--ku-color-bg-surface:');
  });

  it('hyphenates letter→digit boundaries in single-segment names (chart palette)', () => {
    expect(css).toContain('--ku-color-chart-1:');
    expect(css).toContain('--ku-color-chart-8:');
    // existing numbered scales (separate scaleName-key segments) are unaffected
    expect(css).toContain('--ku-space-1: 4px;');
    expect(css).toContain('--ku-font-size-2xl: 32px;');
    expect(css).toContain('--ku-shadow-1:');
  });

  it('emits z-index scale tokens (incl. snackbar) on :root', () => {
    // The snackbar layer reads var(--ku-z-index-snackbar); it must come from the
    // token pipeline, not a hardcoded magic number, to stack with appbar/sidebar.
    expect(css).toMatch(/:root\s*\{[^}]*--ku-z-index-snackbar: 1400;/s);
    expect(css).toContain('--ku-z-index-appbar: 1100;');
    expect(css).toContain('--ku-z-index-sidebar: 1000;');
  });

  it('emits theme-independent focus-ring tokens on :root', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--ku-focus-ring-width: 2px;/s);
    expect(css).toContain('--ku-focus-ring-offset: 2px;');
  });

  it('declares comfortable density vars on :root by default', () => {
    expect(css).toMatch(
      /:root\s*\{[^}]*--ku-density-control-padding-y: 8px;[^}]*--ku-density-row-height: 40px;/s,
    );
    expect(css).toContain('--ku-density-control-padding-x: 12px;');
    expect(css).toContain('--ku-density-row-padding-y: 8px;');
    expect(css).toContain('--ku-density-row-padding-x: 12px;');
  });

  it('overrides density vars with tighter values under [data-density="compact"]', () => {
    expect(css).toMatch(
      /\[data-density='compact'\]\s*\{[^}]*--ku-density-control-padding-y: 4px;[^}]*--ku-density-row-height: 32px;/s,
    );
    expect(css).toMatch(
      /\[data-density='compact'\]\s*\{[^}]*--ku-density-control-padding-x: 8px;/s,
    );
  });

  it('emits an explicit [data-density="comfortable"] block so density can be reset under a compact ancestor', () => {
    expect(css).toMatch(/\[data-density='comfortable'\]\s*\{[^}]*--ku-density-row-height: 40px;/s);
  });

  it('emits a fixed, theme-independent brand ramp on :root', () => {
    // Anchor step equals the DS light primary; ramp is the same in dark + light.
    expect(css).toMatch(/:root\s*\{[^}]*--ku-brand-600: #1B5FCC;/s);
    expect(css).toContain('--ku-brand-50: #EFF4FE;');
    expect(css).toContain('--ku-brand-900: #142F61;');
    // It must NOT be duplicated into the theme override blocks (it's not a theme color).
    expect(css).not.toMatch(/\[data-theme="dark"\][^{]*\{[^}]*--ku-brand-600/s);
  });

  it('emits back-compat aliases for renamed v1 colour tokens on :root (#47)', () => {
    // Aliases delegate to the replacement via var(), so they resolve per theme.
    expect(css).toMatch(/:root\s*\{[^}]*--ku-color-bg-subtle: var\(--ku-color-bg-surface\);/s);
    expect(css).toContain('--ku-color-border-default: var(--ku-color-border);');
    expect(css).toContain('--ku-color-fg-default: var(--ku-color-text-primary);');
    // Aliases are theme-independent — not duplicated into the override blocks.
    expect(css).not.toMatch(/\[data-theme="dark"\][^{]*\{[^}]*--ku-color-bg-subtle/s);
  });

  it('emits a theme-aware elevation scale with back-compat numbered aliases', () => {
    // Named, theme-aware scale: emitted, and softer/low-alpha under the light theme.
    expect(css).toContain('--ku-shadow-md:');
    expect(css).toContain('--ku-shadow-xl:');
    expect(css).toMatch(
      /\[data-theme="light"\][^{]*\{[^}]*--ku-shadow-sm: 0 1px 2px rgba\(16, 20, 31/s,
    );
    // The old numbered tokens become aliases that delegate via var(), so the
    // components still reading --ku-shadow-{1,2,3} resolve to the new scale.
    expect(css).toMatch(/:root\s*\{[^}]*--ku-shadow-1: var\(--ku-shadow-sm\);/s);
    expect(css).toContain('--ku-shadow-2: var(--ku-shadow-md);');
    expect(css).toContain('--ku-shadow-3: var(--ku-shadow-lg);');
  });
});

describe('component CSS token references stay in sync with the pipeline', () => {
  const emitted = emittedTokenNames(buildThemeCss());
  const cssFiles = collectFiles(srcDir, (n) => n.endsWith('.css'));

  // Some `--ku-*` custom properties are not pipeline tokens but are set at
  // runtime by a component (e.g. Popover sets `--ku-anchor-name` via inline
  // style for CSS anchor positioning). Collect every `--ku-*` name a component
  // assigns (in a CSS declaration or as an inline-style object key in TSX)
  // so reading one of those is not flagged as missing-token drift.
  const componentDefined = new Set<string>();
  for (const file of collectFiles(srcDir, (n) => n.endsWith('.css') || n.endsWith('.tsx'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(--ku-[a-z0-9-]+)\s*:/g)) {
      if (m[1]) componentDefined.add(m[1]); // CSS declaration
    }
    for (const m of text.matchAll(/\[\s*['"](--ku-[a-z0-9-]+)['"]\s*\]/g)) {
      if (m[1]) componentDefined.add(m[1]); // inline-style object key in TSX
    }
  }

  it('finds CSS files to scan', () => {
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it('never reads a --ku-* token that the pipeline does not emit without a var() fallback', () => {
    // Catches the HoverCard-style drift where a component referenced
    // var(--ku-line-height-normal), a token the generator never emits and that
    // had no fallback, so the declaration silently resolved to nothing. A read
    // is allowed only if the token is emitted by the pipeline, set by the
    // component itself, or the var() supplies a fallback.
    const offenders: string[] = [];
    for (const file of cssFiles) {
      const text = readFileSync(file, 'utf8');
      for (const { name, hasFallback } of tokenReads(text)) {
        if (!hasFallback && !emitted.has(name) && !componentDefined.has(name)) {
          offenders.push(`${relative(srcDir, file)} -> var(${name})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
