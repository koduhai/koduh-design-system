/**
 * Tailwind CSS preset that maps the design system's semantic color tokens onto
 * Tailwind's palette as CSS variables (`var(--ku-color-*)`). Because the values
 * are *variables* — not literals — utilities like `bg-primary`, `text-fg-muted`
 * or `bg-surface` automatically follow the active theme, whether it's driven by
 * the `data-theme` attribute (KoduhThemeProvider) or a `.dark`/`.light` class
 * (Tailwind's `darkMode: 'class'`). See `dist/theme.css`.
 *
 * Usage — tailwind.config.js (ESM):
 *
 *   import koduhaiPreset from '@koduhai/design-system/tailwind-preset';
 *   export default {
 *     presets: [koduhaiPreset],
 *     content: ['./index.html', './src/**\/*.{ts,tsx}'],
 *     darkMode: 'class',
 *   };
 *
 * Requires importing `@koduhai/design-system/theme.css` once at app entry so the
 * `--ku-color-*` variables are defined.
 *
 * SCOPE: this preset maps ONLY colors + fontFamily. It deliberately does NOT map
 * spacing, borderRadius or fontSize, because those would clobber Tailwind's
 * built-in numeric scales (`p-4`, `rounded-md`, `text-sm`, …) that consumers
 * already depend on. Background and text tokens are renamed (canvas/surface/
 * raised, fg/fg-muted/fg-disabled) to avoid awkward `bg-bg-*` / `text-text-*`
 * utility names.
 */
import { themes } from '../theme/tokens';

/** `var(--ku-color-<name>)` for a kebab-cased token name. */
const color = (name: string) => `var(--ku-color-${name})`;

// Categorical chart palette, derived from the tokens so it stays in sync if the
// palette grows: chart1…chartN → { '1': var(--ku-color-chart-1), … }.
const chart: Record<string, string> = Object.fromEntries(
  Object.keys(themes.dark.color)
    .filter((key) => /^chart\d+$/.test(key))
    .map((key) => {
      const n = key.slice('chart'.length);
      return [n, color(`chart-${n}`)];
    }),
);

export const koduhaiPreset = {
  theme: {
    extend: {
      colors: {
        // Action / status tones — mirror the shared tonal vocabulary.
        primary: { DEFAULT: color('primary'), contrast: color('primary-contrast') },
        danger: { DEFAULT: color('danger'), fg: color('danger-fg') },
        success: { DEFAULT: color('success'), fg: color('success-fg') },
        warning: { DEFAULT: color('warning'), fg: color('warning-fg') },
        info: { DEFAULT: color('info'), fg: color('info-fg') },
        // Lines / dividers.
        border: color('border'),
        // Surfaces (renamed from bg* to keep utilities readable: bg-canvas, …).
        canvas: color('bg-default'),
        surface: color('bg-surface'),
        raised: color('bg-raised'),
        // Foreground text (renamed from text* → fg: text-fg, text-fg-muted, …).
        fg: {
          DEFAULT: color('text-primary'),
          muted: color('text-secondary'),
          disabled: color('text-disabled'),
        },
        // Data-viz categorical palette: bg-chart-1 … border-chart-8.
        chart,
      },
      fontFamily: {
        sans: 'var(--ku-font-family-base)',
        mono: 'var(--ku-font-family-mono)',
      },
    },
  },
} as const;

export default koduhaiPreset;
