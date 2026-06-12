import { defineConfig } from 'tsup';
import { copyFileSync, existsSync } from 'node:fs';

/**
 * loader: { '.css': 'local-css' } applies to ALL CSS files processed by
 * tsup's built-in postcss plugin.  It is safe for both use-cases here:
 *
 * - reset.css uses only element/pseudo selectors — local-css does NOT scope
 *   those, so the global reset is preserved as-is.
 * - *.module.css files use class selectors — local-css hashes them (e.g.
 *   `.box` → `.Spike_box`) AND produces a JS default-export object mapping
 *   original → scoped names, so `import styles from './X.module.css'` works.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/theme/index.ts',
    'src/icons/index.ts',
    'src/tailwind-preset/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: false,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.css': 'local-css' },
  // The bundled CSS lands at dist/index.css (named after the index entry), but
  // the public import specifier is `@koduhai/design-system/styles.css`. Emit a
  // matching dist/styles.css so the on-disk filename matches the specifier.
  async onSuccess() {
    // styles.css is a declared package export, so its absence is a broken build,
    // not a no-op: fail loudly if the bundled CSS the copy depends on is missing.
    if (!existsSync('dist/index.css')) {
      throw new Error(
        'tsup onSuccess: dist/index.css was not emitted, so dist/styles.css (a declared export) cannot be produced.',
      );
    }
    copyFileSync('dist/index.css', 'dist/styles.css');
  },
});
