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
    xl: '16px',
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
  zIndex: {
    appbar: '1100',
    sidebar: '1000',
    snackbar: '1400',
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
      primary: '#6E90E0',
      primaryContrast: '#0A0E1A',
      danger: '#EE7B7B',
      success: '#57C98B',
      warning: '#E4B24A',
      info: '#6E90E0',
      accent: '#B488E6',
      // Foreground variants tuned for AA text contrast on bg surfaces (the
      // *fill* colors above are bright enough on dark surfaces to double as
      // text, so fg == fill here; verified in contrast.test.ts).
      successFg: '#57C98B',
      warningFg: '#E4B24A',
      dangerFg: '#EE7B7B',
      infoFg: '#6E90E0',
      accentFg: '#B488E6',
      bgDefault: '#0A0E1A',
      bgSurface: '#141A2A',
      bgRaised: '#1C2438',
      // Selected/active list-row fill: a translucent brand wash (16% primary).
      // Because it is semi-transparent it tints whatever surface it sits on and
      // stays perceptibly distinct from it in BOTH themes (unlike bg-raised, which
      // equals bg-default in light). The single token replaces the per-component
      // color-mix rules so selection looks the same across Menu/CommandPalette/
      // Sidebar/Tabs/Tree. Text legibility on the tint is guarded in contrast.test.ts.
      bgSelected: 'color-mix(in srgb, var(--ku-color-primary) 16%, transparent)',
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
    // Theme-aware elevation. Dark surfaces need deeper shadows to read; each level
    // layers a tight contact shadow under a softer ambient one. `highlight` is a
    // subtle top inset used as a sheen on solid (colored) surfaces.
    shadow: {
      xs: '0 1px 2px rgba(0, 0, 0, 0.35)',
      sm: '0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(0, 0, 0, 0.3)',
      md: '0 4px 10px -2px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
      lg: '0 14px 28px -6px rgba(0, 0, 0, 0.55), 0 4px 10px -4px rgba(0, 0, 0, 0.45)',
      xl: '0 28px 56px -12px rgba(0, 0, 0, 0.6), 0 10px 20px -8px rgba(0, 0, 0, 0.5)',
      highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
      // See dark theme: the same translucent 16% primary wash, theme-adaptive via
      // --ku-color-primary, so selection stays visible on the white page.
      bgSelected: 'color-mix(in srgb, var(--ku-color-primary) 16%, transparent)',
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
    // Theme-aware elevation. Light shadows are soft and low-alpha, tinted with the
    // near-black text color (16,20,31) for a cooler, less harsh cast than pure black.
    shadow: {
      xs: '0 1px 2px rgba(16, 20, 31, 0.06)',
      sm: '0 1px 2px rgba(16, 20, 31, 0.06), 0 1px 1px rgba(16, 20, 31, 0.04)',
      md: '0 4px 8px -2px rgba(16, 20, 31, 0.1), 0 2px 4px -2px rgba(16, 20, 31, 0.06)',
      lg: '0 12px 24px -6px rgba(16, 20, 31, 0.14), 0 4px 8px -4px rgba(16, 20, 31, 0.08)',
      xl: '0 24px 48px -12px rgba(16, 20, 31, 0.18), 0 8px 16px -8px rgba(16, 20, 31, 0.1)',
      highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
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
