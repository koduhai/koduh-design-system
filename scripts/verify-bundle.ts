// Verifies the ESM build tree-shakes the way a real consumer's bundler would.
//
// Tree-shaking only kicks in when the bundler resolves the package BY NAME (so
// it reads `sideEffects` from package.json), not via an absolute path. So we
// stage a temp consumer with the built package in its node_modules, then bundle
// a single-component import with esbuild and assert that unrelated components'
// JS is dropped. CSS is stubbed side-effect-free (consumers import styles.css
// separately; CSS is not what we're measuring here). React is a peer dependency
// and stays external.
import { build, type Plugin } from 'esbuild';
import { writeFileSync, readFileSync, mkdtempSync, statSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Markers that appear ONLY in components other than Button (all JS, not CSS).
const FORBIDDEN = [
  'Collapse sidebar', // Sidebar aria-label
  'sidebar-list', // Sidebar useId prefix
  'textfield', // TextField useId prefix
  'Breadcrumb', // PageHeader nav aria-label
];

// Stage a temp consumer: temp/node_modules/@koduhai/design-system = { package.json, dist }.
const dir = mkdtempSync(join(tmpdir(), 'ku-treeshake-'));
const pkgDir = join(dir, 'node_modules', '@koduhai', 'design-system');
mkdirSync(pkgDir, { recursive: true });
cpSync(join(root, 'package.json'), join(pkgDir, 'package.json'));
cpSync(join(root, 'dist'), join(pkgDir, 'dist'), { recursive: true });

const entry = join(dir, 'entry.mjs');
writeFileSync(entry, `import { Button } from '@koduhai/design-system';\nconsole.log(Button);\n`);

// Stub CSS imports as empty, side-effect-free modules so we measure JS only.
const cssStub: Plugin = {
  name: 'css-stub',
  setup(b) {
    b.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({
      contents: 'export default {}',
      loader: 'js',
    }));
  },
};

async function main() {
  const out = join(dir, 'out.mjs');
  await build({
    entryPoints: [entry],
    absWorkingDir: dir,
    bundle: true,
    format: 'esm',
    minify: true,
    treeShaking: true,
    // React is a peer dependency — a real consumer provides it, so it's external.
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outfile: out,
    plugins: [cssStub],
    logLevel: 'silent',
  });

  const bundled = readFileSync(out, 'utf8');
  const leaked = FORBIDDEN.filter((m) => bundled.includes(m));

  const raw = statSync(out).size;
  const gz = gzipSync(bundled).length;
  console.log(`Button-only bundle (JS, CSS stubbed): ${raw} B raw, ${gz} B gzip`);

  if (leaked.length > 0) {
    console.error(`✗ Tree-shaking FAILED — unrelated component code leaked: ${leaked.join(', ')}`);
    process.exit(1);
  }
  console.log('✓ Tree-shaking OK — unused components excluded from a Button-only import.');
}

void main();
