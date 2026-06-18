/*
 * Builds a version-pinned metadata snapshot for the MCP server.
 *
 * Reads the repo's source of truth — docs/FEATURES.md (categories, one-line
 * descriptions, source paths), each component's `<Name>Props` interface (props,
 * via the TypeScript compiler API), and src/theme/tokens.ts (design tokens) —
 * and freezes it into mcp/data/<version>/{components,tokens,index}.json.
 *
 * The snapshot is keyed by the package.json version, so a consumer pinned to an
 * older release can query docs that match what they actually installed. Run
 * after any prop/token change (and before publishing a version):
 *   npm run build:metadata    (from mcp/)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const read = (p: string) => readFileSync(resolve(repoRoot, p), 'utf8');

const version = JSON.parse(read('package.json')).version as string;

// --- shared helpers (mirrors docs-site/scripts/generate-pages.ts) ----------

const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

interface PropMeta {
  name: string;
  type: string;
  required: boolean;
  default: string | null;
  description: string;
}
interface ComponentMeta {
  name: string;
  slug: string;
  category: string;
  description: string;
  also: string[];
  sourcePath: string;
  import: string;
  props: PropMeta[] | null; // null = union-typed (no single interface)
}

function parseFeatures(): ComponentMeta[] {
  const lines = read('docs/FEATURES.md').split('\n');
  const out: ComponentMeta[] = [];
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

    const ticks = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (!ticks.length) continue;
    const pathTick = ticks.find((t) => t.includes('/'));
    if (!pathTick) continue;

    const name = ticks[0].replace(/\s*\(.*$/, '').trim();
    const also = ticks.slice(1).filter((t) => !t.includes('/') && /^[A-Z]/.test(t) && t !== name);

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

    let sourcePath = pathTick;
    if (sourcePath.endsWith('/')) sourcePath += `${name}.tsx`;

    const importNames = [name, ...also].join(', ');
    out.push({
      name,
      slug: kebab(name),
      category,
      description,
      also,
      sourcePath,
      import: `import { ${importNames} } from '@koduhai/design-system';`,
      props: null,
    });
  }
  return out;
}

function jsdocText(node: ts.Node): string {
  for (const d of ts.getJSDocCommentsAndTags(node)) {
    if (ts.isJSDoc(d) && d.comment) {
      return typeof d.comment === 'string' ? d.comment : d.comment.map((c) => c.text).join('');
    }
  }
  return '';
}

function parseDefault(doc: string): string | null {
  const at = doc.match(/@default\s+(.+)/);
  if (at) return at[1].trim();
  const sentence = doc.match(/defaults?\s+to\s+([^.]+)\./i);
  return sentence ? sentence[1].trim() : null;
}

function extractProps(sourcePath: string, interfaceName: string): PropMeta[] | null {
  const abs = resolve(repoRoot, sourcePath);
  if (!existsSync(abs)) return null;
  const src = readFileSync(abs, 'utf8');
  const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  let iface: ts.InterfaceDeclaration | undefined;
  sf.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) iface = node;
  });
  if (!iface) return null;

  const rows: PropMeta[] = [];
  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const doc = jsdocText(member);
    rows.push({
      name: member.name.getText(sf),
      type: member.type ? member.type.getText(sf) : 'unknown',
      required: !member.questionToken,
      default: parseDefault(doc),
      description: doc
        .replace(/defaults?\s+to\s+[^.]+\.\s*/i, '')
        .replace(/@default.*/s, '')
        .trim(),
    });
  }
  return rows;
}

// --- tokens ----------------------------------------------------------------

async function buildTokens() {
  // tokens.ts is pure data; import it through tsx so we serialize the real values.
  const mod = await import(pathToFileURL(resolve(repoRoot, 'src/theme/tokens.ts')).href);
  return {
    version,
    primitives: mod.primitives ?? null,
    tokens: mod.tokens ?? null,
    themes: mod.themes ?? null,
  };
}

// --- run -------------------------------------------------------------------

const components = parseFeatures();
for (const c of components) {
  c.props = extractProps(c.sourcePath, `${c.name}Props`);
}

const outDir = resolve(scriptDir, '..', 'data', version);
mkdirSync(outDir, { recursive: true });

writeFileSync(
  resolve(outDir, 'components.json'),
  JSON.stringify({ version, count: components.length, components }, null, 2),
  'utf8',
);

const tokens = await buildTokens();
writeFileSync(resolve(outDir, 'tokens.json'), JSON.stringify(tokens, null, 2), 'utf8');

const categories = [...new Set(components.map((c) => c.category))];
writeFileSync(
  resolve(outDir, 'index.json'),
  JSON.stringify(
    { version, componentCount: components.length, categories, hasTokens: !!tokens.tokens },
    null,
    2,
  ),
  'utf8',
);

console.log(
  `Wrote metadata for v${version}: ${components.length} components, ${categories.length} categories, tokens ${tokens.tokens ? 'ok' : 'MISSING'} -> mcp/data/${version}/`,
);
