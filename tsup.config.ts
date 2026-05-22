import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/index.ts', 'src/icons/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: false,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.css': 'css' },
});
