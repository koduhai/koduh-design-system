// Sidebar navigation. The static Overview + Foundations groups are hand-kept;
// the component groups are generated from docs/FEATURES.md by
// docs-site/scripts/generate-pages.ts (run `npx tsx docs-site/scripts/generate-pages.ts`).

import { componentNav } from './components.generated';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

export const nav: NavGroup[] = [
  {
    title: 'Overview',
    links: [
      { label: 'Introduction', href: '/' },
      { label: 'Components', href: '/components/' },
    ],
  },
  {
    title: 'Foundations',
    links: [{ label: 'Color', href: '/foundations/color/' }],
  },
  ...componentNav,
];
