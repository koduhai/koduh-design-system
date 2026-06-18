/*
 * Docs page generator.
 *
 * Source of truth:
 *   - docs/FEATURES.md  → component list, category grouping, one-line description,
 *                         and the source path for each component.
 *   - src/components/<Name>/<Name>.tsx → the props table, extracted via the
 *                         TypeScript compiler API (the primary `export interface
 *                         <Name>Props`). Union-typed prop bags (Select, Combobox,
 *                         Calendar) have no single interface; those pages render a
 *                         "see type definitions" note instead of a partial table.
 *
 * Output (all overwritten on each run):
 *   - docs-site/src/pages/components/<slug>.astro   (one per component)
 *   - docs-site/src/pages/components/index.astro     (grouped index)
 *   - docs-site/src/data/components.generated.ts      (nav data)
 *
 * Run from the repo root (which has tsx + typescript):
 *   npx tsx docs-site/scripts/generate-pages.ts
 *
 * Hand-authored pages with live demos are listed in HANDWRITTEN and skipped so
 * the generator never clobbers them.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const docsRoot = resolve(repoRoot, 'docs-site');
const pagesDir = resolve(docsRoot, 'src/pages/components');
const dataDir = resolve(docsRoot, 'src/data');
const demosDir = resolve(docsRoot, 'src/components/demos');
const playgroundDir = resolve(docsRoot, 'src/components/playground');

/** Components that get an interactive props playground. Derived from the seed
 *  entries in src/components/playground/seeds.tsx, so adding a seed is all it
 *  takes to enable a component's playground (no second list to keep in sync). */
function playgroundNames(): Set<string> {
  const dir = resolve(playgroundDir, 'seeds');
  const names = new Set<string>();
  if (!existsSync(dir)) return names;
  for (const f of readdirSync(dir)) {
    if (!/\.tsx?$/.test(f) || f === 'index.ts' || f === 'types.ts') continue;
    const src = readFileSync(resolve(dir, f), 'utf8').replace(/\r\n/g, '\n');
    for (const m of src.matchAll(/^\s{2}(\w+):\s*\{\s*Component:/gm)) names.add(m[1]);
  }
  return names;
}
const PLAYGROUND = playgroundNames();

/** Props never worth a live control (chrome, refs, icon/label slots). */
const CONTROL_HIDE = new Set<string>([
  'className',
  'id',
  'style',
  'asChild',
  'key',
  'ref',
  'icon',
  'startIcon',
  'endIcon',
  'closeLabel',
  'deleteLabel',
  'triggerLabel',
  'formatValue',
]);

/** Slugs whose .astro page is hand-authored; never overwrite these. (None today
 *  — live demos are provided as demo islands picked up automatically.) */
const HANDWRITTEN = new Set<string>();

// --- types -----------------------------------------------------------------

interface PropRow {
  name: string;
  type: string;
  optional: boolean;
  def: string;
  desc: string;
}
interface Component {
  name: string; // primary export, e.g. "DatePicker"
  slug: string; // "date-picker"
  category: string; // from FEATURES.md ### heading
  description: string; // raw markdown-ish one-liner (may contain `code`)
  srcPath: string; // "src/components/DatePicker/DatePicker.tsx"
  also: string[]; // secondary exports mentioned in the bullet
  props: PropRow[] | null;
  controls: Control[]; // playground controls derived from props
}

type Control = { name: string; required?: boolean } & (
  | { kind: 'enum'; options: string[]; def?: string }
  | { kind: 'boolean'; def?: boolean }
  | { kind: 'number'; def?: number }
  | { kind: 'text'; def?: string }
);

// --- helpers ---------------------------------------------------------------

const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

// Astro treats literal { } in markup as JS expression delimiters, so braces in
// any emitted text (types like Record<string, {…}>, JSDoc, etc.) must become
// entities or the page fails to compile.
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');

/** Escape, then turn `inline code` into <code> spans. */
const mdInline = (s: string) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

/** Lede / card text, with a clean fallback when FEATURES.md has no description. */
const ledeHtml = (c: Component) =>
  c.description ? `${mdInline(c.description)}.` : `Part of the ${esc(c.category)} set.`;
const metaDesc = (c: Component) =>
  esc(c.description || `${c.name} component`).replace(/"/g, '&quot;');

// --- 1. parse FEATURES.md --------------------------------------------------

function parseFeatures(): Component[] {
  // CRLF -> LF so generated pages/controls are identical on Windows and Linux
  // checkouts (multi-line JSDoc otherwise embeds the source's line endings).
  const md = readFileSync(resolve(repoRoot, 'docs/FEATURES.md'), 'utf8').replace(/\r\n/g, '\n');
  const lines = md.split('\n');
  const out: Component[] = [];

  let inComponents = false;
  let category = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      inComponents = /^##\s+Components/.test(line);
      continue;
    }
    if (!inComponents) continue;
    if (line.startsWith('### ')) {
      category = line.replace(/^###\s+/, '').trim();
      continue;
    }
    if (!line.startsWith('- ')) continue;

    // Collect backtick groups: first is the primary name, the one containing
    // a slash is the source path, the rest are secondary exports.
    const ticks = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (ticks.length === 0) continue;
    const pathTick = ticks.find((t) => t.includes('/'));
    if (!pathTick) continue;

    const name = ticks[0].replace(/\s*\(.*$/, '').trim(); // strip "(+ useForm…)"
    const also = ticks.slice(1).filter((t) => !t.includes('/') && /^[A-Z]/.test(t) && t !== name);

    // Description: text after the em-dash separator, before the path tick. Some
    // bullets have no dash (e.g. Checkbox, Switch); fall back to whatever sits
    // between the primary name and the source path.
    const dashIdx = line.indexOf('—');
    const pathStart = line.lastIndexOf('`' + pathTick + '`');
    const nameEnd = line.indexOf('`' + ticks[0] + '`') + ticks[0].length + 2;
    let description =
      dashIdx !== -1 && pathStart > dashIdx
        ? line.slice(dashIdx + 1, pathStart)
        : line.slice(nameEnd, pathStart);
    description = description
      .replace(/^[\s—.\-]+/, '')
      .replace(/[\s.]+$/, '')
      .trim();

    let srcPath = pathTick;
    if (srcPath.endsWith('/')) srcPath += `${name}.tsx`;

    out.push({
      name,
      slug: kebab(name),
      category,
      description,
      srcPath,
      also,
      props: null,
      controls: [],
    });
  }
  return out;
}

/** Collect local `export type X = 'a' | 'b'` string-literal-union aliases. */
function extractAliases(srcPath: string): Record<string, string[]> {
  const abs = resolve(repoRoot, srcPath);
  if (!existsSync(abs)) return {};
  const src = readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
  const map: Record<string, string[]> = {};
  for (const m of src.matchAll(/export\s+type\s+(\w+)\s*=\s*([^;]+);/g)) {
    const opts = m[2]
      .split('|')
      .map((s) => s.trim())
      .filter((s) => /^'[^']*'$/.test(s))
      .map((s) => s.slice(1, -1));
    if (opts.length) map[m[1]] = opts;
  }
  return map;
}

/** Map a props interface to live playground controls (enums/booleans/numbers/text). */
function buildControls(props: PropRow[] | null, aliases: Record<string, string[]>): Control[] {
  if (!props) return [];
  const out: Control[] = [];
  for (const p of props) {
    if (CONTROL_HIDE.has(p.name)) continue;
    const t = p.type.trim();
    const literalUnion = (s: string): string[] | null => {
      const parts = s.split('|').map((x) => x.trim());
      return parts.length && parts.every((x) => /^'[^']*'$/.test(x))
        ? parts.map((x) => x.slice(1, -1))
        : null;
    };
    let ctrl: Control | null = null;
    const enumOpts = aliases[t] ?? literalUnion(t);
    if (enumOpts) ctrl = { name: p.name, kind: 'enum', options: enumOpts };
    else if (t === 'boolean') ctrl = { name: p.name, kind: 'boolean' };
    else if (t === 'number') ctrl = { name: p.name, kind: 'number' };
    else if (t === 'string' || t === 'ReactNode') ctrl = { name: p.name, kind: 'text' };
    if (!ctrl) continue;

    if (p.def) {
      if (ctrl.kind === 'boolean') ctrl.def = /true/.test(p.def);
      else if (ctrl.kind === 'number') {
        const n = Number(p.def);
        if (!Number.isNaN(n)) ctrl.def = n;
      } else ctrl.def = p.def.replace(/^['"]|['"]$/g, '');
    }
    if (!p.optional) ctrl.required = true;
    out.push(ctrl);
  }
  return out;
}

// --- 2. extract props via the TS compiler API ------------------------------

function jsdocText(node: ts.Node): string {
  const docs = ts.getJSDocCommentsAndTags(node);
  for (const d of docs) {
    if (ts.isJSDoc(d) && d.comment) {
      return typeof d.comment === 'string' ? d.comment : d.comment.map((c) => c.text).join('');
    }
  }
  return '';
}

function parseDefault(doc: string): string {
  const at = doc.match(/@default\s+(.+)/);
  if (at) return at[1].trim();
  const sentence = doc.match(/defaults?\s+to\s+([^.]+)\./i);
  if (sentence) return sentence[1].trim();
  return '';
}

function extractProps(srcPath: string, interfaceName: string): PropRow[] | null {
  const abs = resolve(repoRoot, srcPath);
  if (!existsSync(abs)) return null;
  const src = readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
  const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  let iface: ts.InterfaceDeclaration | undefined;
  sf.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      iface = node;
    }
  });
  if (!iface) return null;

  const rows: PropRow[] = [];
  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const name = member.name.getText(sf);
    const doc = jsdocText(member);
    rows.push({
      name,
      type: member.type ? member.type.getText(sf) : 'unknown',
      optional: !!member.questionToken,
      def: parseDefault(doc),
      // strip the "Defaults to X." sentence from the visible description
      desc: doc
        .replace(/defaults?\s+to\s+[^.]+\.\s*/i, '')
        .replace(/@default.*/s, '')
        .trim(),
    });
  }
  return rows;
}

// --- 3. emit pages ---------------------------------------------------------

function propsTable(props: PropRow[]): string {
  const rows = props
    .map((p) => {
      const def = p.def ? `<code>${esc(p.def)}</code>` : p.optional ? '—' : '<em>required</em>';
      return `      <tr>
        <td><code>${esc(p.name)}</code></td>
        <td><code>${esc(p.type)}</code></td>
        <td>${def}</td>
        <td>${mdInline(p.desc)}</td>
      </tr>`;
    })
    .join('\n');
  return `  <table class="doc-table">
    <thead>
      <tr><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>`;
}

function page(c: Component): string {
  const importNames = [c.name, ...c.also].join(', ');
  const propsSection = c.props
    ? c.props.length > 0
      ? propsTable(c.props)
      : `  <p>This component takes no own props beyond the standard DOM attributes.</p>`
    : `  <p>
    The props for <code>${esc(c.name)}</code> are defined as a union type, so they don't
    reduce to a single table. See the exported <code>${esc(c.name)}Props</code> type and the
    <a href="https://github.com/koduhai/koduh-design-system/blob/main/${c.srcPath}">source</a>.
  </p>`;

  const alsoNote = c.also.length
    ? `\n  <p>Also exported from this module: ${c.also
        .map((n) => `<code>${esc(n)}</code>`)
        .join(', ')}.</p>`
    : '';

  const demoName = `${c.name}Demo`;
  const hasDemo = existsSync(resolve(demosDir, `${demoName}.tsx`));
  const demoImport = hasDemo
    ? `\nimport ${demoName} from '../../components/demos/${demoName}';`
    : '';
  const examplesSection = hasDemo
    ? `\n  <h2>Examples</h2>\n  <${demoName} client:visible />\n`
    : '';

  const hasPlayground = PLAYGROUND.has(c.name) && c.controls.length > 0;
  const playgroundImport = hasPlayground
    ? `\nimport Playground from '../../components/playground/Playground';`
    : '';
  const playgroundSection = hasPlayground
    ? `\n  <h2>Playground</h2>\n  <Playground client:visible name="${c.name}" />\n`
    : '';
  const trailingNote = hasDemo
    ? ''
    : `\n  <p style="margin-top: var(--ku-space-6); color: var(--ku-color-text-secondary); font-size: var(--ku-font-size-sm);">
    Reference page generated from the component source. A live interactive demo for this
    component is coming.
  </p>`;

  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';${playgroundImport}${demoImport}
const base = import.meta.env.BASE_URL.replace(/\\/$/, '');
---

<BaseLayout title="${c.name}" description="${metaDesc(c)}">
  <p class="doc-eyebrow">${esc(c.category)}</p>
  <h1>${esc(c.name)}</h1>
  <p class="doc-lede">${ledeHtml(c)}</p>
${alsoNote}${playgroundSection}${examplesSection}
  <h2>Import</h2>
  <p><code>import &#123; ${esc(importNames)} &#125; from '@koduhai/design-system';</code></p>

  <h2>Props</h2>
${propsSection}${trailingNote}
</BaseLayout>
`;
}

function indexPage(byCategory: Map<string, Component[]>): string {
  const groups = [...byCategory.entries()]
    .map(([cat, items]) => {
      const cards = items
        .map(
          (c) => `    <a class="doc-card" href={base + '/components/${c.slug}/'}>
      <div class="doc-card-title">${esc(c.name)}</div>
      <div class="doc-card-desc">${ledeHtml(c)}</div>
    </a>`,
        )
        .join('\n');
      return `  <h2>${esc(cat)}</h2>
  <div class="doc-grid">
${cards}
  </div>`;
    })
    .join('\n\n');

  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';

const base = import.meta.env.BASE_URL.replace(/\\/$/, '');
---

<BaseLayout title="Components" description="Browse the @koduhai/design-system component surface.">
  <p class="doc-eyebrow">Components</p>
  <h1>Components</h1>
  <p class="doc-lede">
    Live, interactive examples for the flagship components and reference pages (description +
    prop table) for the full surface. Grouped by category, mirroring the library taxonomy.
  </p>

${groups}
</BaseLayout>
`;
}

function navData(byCategory: Map<string, Component[]>): string {
  const groups = [...byCategory.entries()]
    .map(([cat, items]) => {
      const links = items
        .map((c) => `      { label: '${c.name}', href: '/components/${c.slug}/' },`)
        .join('\n');
      return `  {
    title: ${JSON.stringify(cat)},
    links: [
${links}
    ],
  },`;
    })
    .join('\n');

  return `// AUTO-GENERATED by docs-site/scripts/generate-pages.ts — do not edit by hand.
import type { NavGroup } from './nav';

export const componentNav: NavGroup[] = [
${groups}
];
`;
}

// --- run -------------------------------------------------------------------

const components = parseFeatures();

for (const c of components) {
  c.props = extractProps(c.srcPath, `${c.name}Props`);
  c.controls = buildControls(c.props, extractAliases(c.srcPath));
}

// Group preserving FEATURES.md category order.
const byCategory = new Map<string, Component[]>();
for (const c of components) {
  if (!byCategory.has(c.category)) byCategory.set(c.category, []);
  byCategory.get(c.category)!.push(c);
}

mkdirSync(pagesDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

let written = 0;
let skipped = 0;
let unionPages = 0;
for (const c of components) {
  if (HANDWRITTEN.has(c.slug)) {
    skipped++;
    continue;
  }
  if (c.props === null) unionPages++;
  writeFileSync(resolve(pagesDir, `${c.slug}.astro`), page(c), 'utf8');
  written++;
}

writeFileSync(resolve(pagesDir, 'index.astro'), indexPage(byCategory), 'utf8');
writeFileSync(resolve(dataDir, 'components.generated.ts'), navData(byCategory), 'utf8');

// Playground control specs (only for allowlisted components that have controls).
mkdirSync(playgroundDir, { recursive: true });
const controlsMap: Record<string, Control[]> = {};
for (const c of components) {
  if (PLAYGROUND.has(c.name) && c.controls.length > 0) controlsMap[c.name] = c.controls;
}
writeFileSync(
  resolve(playgroundDir, 'controls.generated.ts'),
  `// AUTO-GENERATED by docs-site/scripts/generate-pages.ts — do not edit by hand.
export type Control = { name: string; required?: boolean } & (
  | { kind: 'enum'; options: string[]; def?: string }
  | { kind: 'boolean'; def?: boolean }
  | { kind: 'number'; def?: number }
  | { kind: 'text'; def?: string }
);

export const controlsByName: Record<string, Control[]> = ${JSON.stringify(controlsMap, null, 2)};
`,
  'utf8',
);

console.log(
  `Generated ${written} component pages (${skipped} hand-written skipped, ` +
    `${unionPages} union-typed without a table), plus index + nav across ` +
    `${byCategory.size} categories. Total components: ${components.length}.`,
);
