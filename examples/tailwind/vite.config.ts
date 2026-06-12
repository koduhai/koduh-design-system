import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standard Vite + React setup. The design system is consumed as an installed
// package (file:../.. in package.json), so no alias is needed: Vite resolves
// `@koduhai/design-system` and its `/tailwind-preset`, `/theme.css`,
// `/styles.css` subpath exports straight from the repo's built `dist/`.
export default defineConfig({
  plugins: [react()],
});
