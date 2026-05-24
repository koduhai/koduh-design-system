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
      // Foreground variants tuned for AA text contrast on bg surfaces (the
      // *fill* colors above are bright enough on dark surfaces to double as
      // text, so fg == fill here; verified in contrast.test.ts).
      successFg: '#4ADE80',
      warningFg: '#FBBF24',
      dangerFg: '#FF6B6B',
      infoFg: '#5B9DFF',
      bgDefault: '#0A0E1A',
      bgSurface: '#141A2A',
      bgRaised: '#1C2438',
      border: '#2A3346',
      textPrimary: '#F5F7FA',
      textSecondary: '#A8B2C4',
      textDisabled: '#5C667A',
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
      // Foreground variants: darker than the fill colors so colored status text
      // clears AA on the off-white bgSurface (the worst light-theme case).
      // Verified in contrast.test.ts.
      successFg: '#147A37',
      warningFg: '#7A4F00',
      dangerFg: '#BE2626',
      infoFg: '#1B5FCC',
      bgDefault: '#FFFFFF',
      bgSurface: '#F4F6FA',
      bgRaised: '#FFFFFF',
      border: '#D4DAE5',
      textPrimary: '#10141F',
      textSecondary: '#4A5468',
      textDisabled: '#9AA3B5',
    },
  },
} as const;

export type ColorMode = keyof typeof themes;
export type ColorTokenName = keyof (typeof themes)['dark']['color'];
export type Tokens = typeof tokens;
