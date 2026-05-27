// Single source of truth for all design tokens.
// Theme-independent scales live in `tokens`; color values that change between
// dark/light live in `themes`. The generate-theme-css script turns these into
// CSS custom properties; components only ever read the CSS variables.

export const tokens = {
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  fontFamily: {
    base: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    base: '1.5',
    relaxed: '1.7',
  },
  shadow: {
    1: '0 1px 2px rgba(0,0,0,0.4)',
    2: '0 2px 8px rgba(0,0,0,0.45)',
    3: '0 8px 24px rgba(0,0,0,0.5)',
  },
  zIndex: {
    appbar: '1100',
    sidebar: '1000',
  },
  breakpoint: {
    sm: '600px',
    md: '900px',
    lg: '1200px',
    xl: '1536px',
  },
  duration: {
    fast: '120ms',
    base: '200ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  // Fixed brand tint ramp (theme-independent — same in dark and light, like a
  // Tailwind brand scale). `brand-600` is the DS light `primary` (#1B5FCC); the
  // semantic `primary` token stays theme-adaptive, so brand ≠ primary by design.
  // → --ku-brand-50 … --ku-brand-900
  brand: {
    50: '#EFF4FE',
    100: '#DCE8FC',
    200: '#BBD0F9',
    300: '#8FB0F4',
    400: '#5C89EC',
    500: '#3468E0',
    600: '#1B5FCC',
    700: '#1A4DA6',
    800: '#173E82',
    900: '#142F61',
  },
  // Focus-ring geometry (theme-independent). The ring *color* reuses
  // `--ku-color-primary`; only width/offset live here.
  // → --ku-focus-ring-width, --ku-focus-ring-offset
  focusRing: {
    width: '2px',
    offset: '2px',
  },
} as const;

// Density control. Theme-independent: density is orthogonal to dark/light, and
// switches via a `[data-density]` attribute (the analogue of `[data-theme]`),
// not a token-color swap. `comfortable` is the default emitted on :root; the
// `compact` set is emitted under `[data-density='compact']`, overriding the same
// `--ku-density-*` variables. Components read these vars for their internal
// padding / row-height so a single attribute retightens data-dense surfaces.
//
// WCAG note: these tighten *internal* padding and row height only — never the
// minimum interactive hit-target. Components keep their own min-height/min-width
// floors so compact stays AA-operable.
export const density = {
  comfortable: {
    controlPaddingY: '8px', // --ku-density-control-padding-y (== space-2)
    controlPaddingX: '12px', // --ku-density-control-padding-x (== space-3)
    rowPaddingY: '8px', // --ku-density-row-padding-y (table/menu/listbox row)
    rowPaddingX: '12px', // --ku-density-row-padding-x
    rowHeight: '40px', // --ku-density-row-height (control min-height floor)
  },
  compact: {
    controlPaddingY: '4px', // tighter (== space-1)
    controlPaddingX: '8px', // tighter (== space-2)
    rowPaddingY: '4px',
    rowPaddingX: '8px',
    rowHeight: '32px',
  },
} as const;

// Color tokens per theme. Values chosen to meet WCAG AA (verified at the
// component level via axe-core e2e tests).
export const themes = {
  dark: {
    color: {
      primary: '#5B9DFF',
      primaryContrast: '#0A0E1A',
      danger: '#FF6B6B',
      success: '#4ADE80',
      warning: '#FBBF24',
      info: '#5B9DFF',
      accent: '#C084FC',
      // Foreground variants tuned for AA text contrast on bg surfaces (the
      // *fill* colors above are bright enough on dark surfaces to double as
      // text, so fg == fill here; verified in contrast.test.ts).
      successFg: '#4ADE80',
      warningFg: '#FBBF24',
      dangerFg: '#FF6B6B',
      infoFg: '#5B9DFF',
      accentFg: '#C084FC',
      bgDefault: '#0A0E1A',
      bgSurface: '#141A2A',
      bgRaised: '#1C2438',
      border: '#2A3346',
      textPrimary: '#F5F7FA',
      textSecondary: '#A8B2C4',
      textDisabled: '#5C667A',
      // Categorical chart palette — 8 distinct hues tuned to be bright/saturated
      // enough to read on the dark bgSurface (#141A2A). Ordered for maximal
      // separation between adjacent series. → --ku-color-chart-1 … chart-8
      chart1: '#5B9DFF', // blue
      chart2: '#4ADE80', // green
      chart3: '#FBBF24', // amber
      chart4: '#FF6B6B', // red
      chart5: '#C084FC', // purple
      chart6: '#22D3EE', // cyan
      chart7: '#F472B6', // pink
      chart8: '#A3E635', // lime
    },
  },
  light: {
    color: {
      primary: '#1B5FCC',
      primaryContrast: '#FFFFFF',
      danger: '#C62828',
      success: '#1B7F3B',
      warning: '#9A6700',
      info: '#1B5FCC',
      accent: '#7C3AED',
      // Foreground variants: darker than the fill colors so colored status text
      // clears AA on the off-white bgSurface (the worst light-theme case).
      // Verified in contrast.test.ts.
      successFg: '#147A37',
      warningFg: '#7A4F00',
      dangerFg: '#BE2626',
      infoFg: '#1B5FCC',
      accentFg: '#7C3AED',
      bgDefault: '#FFFFFF',
      bgSurface: '#F4F6FA',
      bgRaised: '#FFFFFF',
      border: '#D4DAE5',
      textPrimary: '#10141F',
      textSecondary: '#4A5468',
      textDisabled: '#9AA3B5',
      // Categorical chart palette — 8 distinct hues darkened/saturated to read
      // on the off-white light bgSurface (#F4F6FA), mirroring the dark hue
      // order. → --ku-color-chart-1 … chart-8
      chart1: '#1B5FCC', // blue
      chart2: '#1B7F3B', // green
      chart3: '#B45309', // amber
      chart4: '#C62828', // red
      chart5: '#7C3AED', // purple
      chart6: '#0E7490', // cyan
      chart7: '#BE185D', // pink
      chart8: '#4D7C0F', // lime
    },
  },
} as const;

/** A concrete, resolved color theme. Always maps to a real token set. */
export type ColorMode = keyof typeof themes;
/**
 * A user-facing color preference. Adds `'system'` to the resolved {@link ColorMode}
 * set; `'system'` follows the OS `prefers-color-scheme` and resolves to a concrete
 * {@link ColorMode} at runtime.
 */
export type ColorScheme = ColorMode | 'system';
export type ColorTokenName = keyof (typeof themes)['dark']['color'];
export type Tokens = typeof tokens;
export type Density = keyof typeof density;
