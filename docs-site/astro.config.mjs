import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Docs site for @koduhai/design-system.
// The library is consumed as a built package (file:.. dep), so React stays a
// single instance (peer dep) and CSS Modules arrive pre-scoped from dist.
export default defineConfig({
  integrations: [react()],
  // Static output: the docs are content; component demos hydrate as islands.
  output: 'static',
  site: 'https://koduhai.github.io',
  base: '/koduh-design-system',
});
