import type { Config } from 'tailwindcss';
import koduhaiPreset from '@koduhai/design-system/tailwind-preset';

// The preset maps the design system's semantic color tokens + brand ramp onto
// Tailwind's palette as `var(--ku-*)` variables, so utilities like `bg-canvas`,
// `text-fg`, `bg-primary`, and `bg-brand-500` follow the active theme. It only
// extends colors + fontFamily (see src/tailwind-preset/index.ts).
//
// `darkMode: 'class'` is what makes the toggle in App.tsx work: theme.css emits
// its dark/light overrides under `.dark`/`.light` classes (as well as the
// `[data-theme]` attribute), so flipping the class on <html> re-themes both the
// Tailwind utilities and the design-system components at once.
export default {
  presets: [koduhaiPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
} satisfies Config;
