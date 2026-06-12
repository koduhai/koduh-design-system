// Single source of truth for all design tokens.
//
// The color system is a formal 3-tier pipeline (see docs/theme_specification.md):
//   1. PRIMITIVES (`primitives`)  — raw, theme-independent color ramps. No
//      semantics; just real scales (neutral, blue, green, amber, red, violet,
//      cyan, pink, lime). Emitted as `--ku-color-{ramp}-{stop}` on :root.
//   2. SEMANTIC ALIASES (`themes`) — per-mode color *roles* (primary, danger,
//      bgDefault, textPrimary, chart1 …). Each value REFERENCES a primitive
//      stop instead of a raw literal, so the emitted hex equals its primitive.
//   3. COMPONENT  — CSS-local custom properties inside each `*.module.css`
//      (e.g. `--btn-main`). Nothing lives in this file; components read the
//      semantic `--ku-color-*` vars.
//
// Theme-independent scales (spacing, radii, type, etc.) live in `tokens`; color
// roles that change between dark/light live in `themes`. The generate-theme-css
// script turns these into CSS custom properties; components only ever read the
// CSS variables.

// ---------------------------------------------------------------------------
// Tier 1: PRIMITIVES — raw color ramps, theme-independent (identical in dark and
// light, like a Tailwind palette). These carry no meaning on their own; the
// semantic tier (`themes`) picks stops from here. Each ramp is authored so its
// stops INCLUDE the exact hex values the semantic tier needs (so output is
// byte-identical to the pre-refactor literals), with interpolated intermediate
// stops so each ramp reads as a real light -> dark scale. Some ramps carry an
// extra half-stop (e.g. `450`, `650`) where two distinct semantic values fall
// in the same lightness band and both must be referenced verbatim.
// -> --ku-color-{ramp}-{stop}  (e.g. --ku-color-blue-400, --ku-color-neutral-600)
//
// Note: the separate fixed `brand` ramp (in `tokens`, -> --ku-brand-*) is a
// distinct brand-blue scale kept as-is for Tailwind consumers; `blue` here is
// the primitive backing the semantic `primary`/`info`/chart-blue roles. They
// share a family but are intentionally separate scales.
export const primitives = {
  // Cool grays — backs every surface, border and text role in both themes.
  neutral: {
    0: '#FFFFFF', // primaryContrast (light) / bgDefault + bgRaised (light)
    50: '#F5F7FA', // textPrimary (dark)
    100: '#F4F6FA', // bgSurface (light)
    200: '#D4DAE5', // border (light)
    300: '#BEC6D5',
    400: '#A8B2C4', // textSecondary (dark)
    450: '#9AA3B5', // textDisabled (light)
    500: '#7B8598',
    600: '#5C667A', // textDisabled (dark)
    650: '#4A5468', // textSecondary (light)
    700: '#3A4457',
    750: '#2A3346', // border (dark)
    800: '#1C2438', // bgRaised (dark)
    850: '#141A2A', // bgSurface (dark)
    900: '#10141F', // textPrimary (light)
    950: '#0A0E1A', // bgDefault + primaryContrast (dark)
  },
  // Blue — primary / info / chart-blue.
  blue: {
    50: '#F5F9FF',
    100: '#E8F1FF',
    200: '#C7DEFF',
    300: '#93BEFF',
    400: '#5B9DFF', // chart1 (dark)
    450: '#6E90E0', // primary / info (dark)
    500: '#4578D6',
    600: '#1B5FCC', // primary / info / chart1 (light)
    700: '#174DA5',
    800: '#143B7E',
    900: '#102A57',
  },
  // Green — success / chart-green.
  green: {
    50: '#F1FCF5',
    100: '#DEF9E8',
    200: '#AEF0C6',
    300: '#4ADE80', // chart2 (dark)
    400: '#57C98B', // success / successFg (dark)
    500: '#39A463',
    600: '#1B7F3B', // success / chart2 (light)
    650: '#147A37', // successFg (light)
    700: '#125F30',
    800: '#0F4429',
    900: '#0D2C22',
  },
  // Amber — warning / chart-amber.
  amber: {
    50: '#FFFAED',
    100: '#FEF2D3',
    200: '#FDDF92',
    300: '#FBBF24', // chart3 (dark)
    400: '#E4B24A', // warning / warningFg (dark)
    500: '#CC832A',
    600: '#B45309', // chart3 (light)
    650: '#9A6700', // warning (light)
    750: '#7A4F00', // warningFg (light)
    800: '#583C08',
    900: '#372810',
  },
  // Red — danger / chart-red.
  red: {
    50: '#FFF5F5',
    100: '#FFE7E7',
    200: '#FFC1C1',
    300: '#EE7B7B', // danger / dangerFg (dark)
    350: '#FF6B6B', // chart4 (dark)
    400: '#DE5A5A',
    500: '#D03D3D',
    600: '#C62828', // danger / chart4 (light)
    650: '#BE2626', // dangerFg (light)
    700: '#912023',
    800: '#641A20',
    900: '#3C151D',
  },
  // Violet — accent / chart-purple.
  violet: {
    50: '#FAF5FF',
    100: '#F2E6FE',
    200: '#E0C2FE',
    300: '#C084FC', // chart5 (dark)
    400: '#B488E6', // accent / accentFg (dark)
    500: '#9861EA',
    600: '#7C3AED', // accent / accentFg / chart5 (light)
    700: '#602FB8',
    800: '#432484',
    900: '#2A1A55',
  },
  // Cyan — chart-cyan only (no semantic role yet).
  cyan: {
    50: '#EDFBFE',
    100: '#D3F6FC',
    200: '#91E9F7',
    300: '#22D3EE', // chart6 (dark)
    400: '#1AADC8',
    500: '#1491AC',
    600: '#0E7490', // chart6 (light)
    700: '#0D556D',
    800: '#0C3749',
  },
  // Pink — chart-pink only.
  pink: {
    50: '#FEF4F9',
    100: '#FDE3F0',
    200: '#FAB9DB',
    300: '#F472B6', // chart7 (dark)
    400: '#DE4E92',
    500: '#CE3378',
    600: '#BE185D', // chart7 (light)
    700: '#881549',
    800: '#521235',
  },
  // Lime — chart-lime only.
  lime: {
    50: '#F8FDEF',
    100: '#EDFAD7',
    200: '#D1F39A',
    300: '#A3E635', // chart8 (dark)
    400: '#81BC26',
    500: '#679C1A',
    600: '#4D7C0F', // chart8 (light)
    700: '#395B12',
    800: '#253A16',
  },
} as const;

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

// Tier 2: SEMANTIC ALIASES — per-theme color *roles*. Each value REFERENCES a
// `primitives` stop (never a raw literal) so the role's meaning is decoupled from
// its raw color; the generator still emits the resolved hex, so output is
// unchanged. Values were chosen to meet WCAG AA (verified at the component level
// via axe-core e2e tests, and at the token level in contrast.test.ts). The
// theme-aware `shadow` block stays raw (it is not a flat color ramp).
export const themes = {
  dark: {
    color: {
      primary: primitives.blue[450],
      primaryContrast: primitives.neutral[950],
      danger: primitives.red[300],
      success: primitives.green[400],
      warning: primitives.amber[400],
      info: primitives.blue[450],
      accent: primitives.violet[400],
      // Foreground variants tuned for AA text contrast on bg surfaces (the
      // *fill* colors above are bright enough on dark surfaces to double as
      // text, so fg == fill here; verified in contrast.test.ts).
      successFg: primitives.green[400],
      warningFg: primitives.amber[400],
      dangerFg: primitives.red[300],
      infoFg: primitives.blue[450],
      accentFg: primitives.violet[400],
      bgDefault: primitives.neutral[950],
      bgSurface: primitives.neutral[850],
      bgRaised: primitives.neutral[800],
      // Selected/active list-row fill: a translucent brand wash (16% primary).
      // Because it is semi-transparent it tints whatever surface it sits on and
      // stays perceptibly distinct from it in BOTH themes (unlike bg-raised, which
      // equals bg-default in light). The single token replaces the per-component
      // color-mix rules so selection looks the same across Menu/CommandPalette/
      // Sidebar/Tabs/Tree. Text legibility on the tint is guarded in contrast.test.ts.
      bgSelected: 'color-mix(in srgb, var(--ku-color-primary) 16%, transparent)',
      border: primitives.neutral[750],
      textPrimary: primitives.neutral[50],
      textSecondary: primitives.neutral[400],
      textDisabled: primitives.neutral[600],
      // Categorical chart palette — 8 distinct hues tuned to be bright/saturated
      // enough to read on the dark bgSurface (#141A2A). Ordered for maximal
      // separation between adjacent series. → --ku-color-chart-1 … chart-8
      chart1: primitives.blue[400], // blue
      chart2: primitives.green[300], // green
      chart3: primitives.amber[300], // amber
      chart4: primitives.red[350], // red
      chart5: primitives.violet[300], // purple
      chart6: primitives.cyan[300], // cyan
      chart7: primitives.pink[300], // pink
      chart8: primitives.lime[300], // lime
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
      primary: primitives.blue[600],
      primaryContrast: primitives.neutral[0],
      danger: primitives.red[600],
      success: primitives.green[600],
      warning: primitives.amber[650],
      info: primitives.blue[600],
      accent: primitives.violet[600],
      // Foreground variants: darker than the fill colors so colored status text
      // clears AA on the off-white bgSurface (the worst light-theme case).
      // Verified in contrast.test.ts.
      successFg: primitives.green[650],
      warningFg: primitives.amber[750],
      dangerFg: primitives.red[650],
      infoFg: primitives.blue[600],
      accentFg: primitives.violet[600],
      bgDefault: primitives.neutral[0],
      bgSurface: primitives.neutral[100],
      bgRaised: primitives.neutral[0],
      // See dark theme: the same translucent 16% primary wash, theme-adaptive via
      // --ku-color-primary, so selection stays visible on the white page.
      bgSelected: 'color-mix(in srgb, var(--ku-color-primary) 16%, transparent)',
      border: primitives.neutral[200],
      textPrimary: primitives.neutral[900],
      textSecondary: primitives.neutral[650],
      textDisabled: primitives.neutral[450],
      // Categorical chart palette — 8 distinct hues darkened/saturated to read
      // on the off-white light bgSurface (#F4F6FA), mirroring the dark hue
      // order. → --ku-color-chart-1 … chart-8
      chart1: primitives.blue[600], // blue
      chart2: primitives.green[600], // green
      chart3: primitives.amber[600], // amber
      chart4: primitives.red[600], // red
      chart5: primitives.violet[600], // purple
      chart6: primitives.cyan[600], // cyan
      chart7: primitives.pink[600], // pink
      chart8: primitives.lime[600], // lime
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
/** The raw, theme-independent primitive color ramps (tier 1). */
export type Primitives = typeof primitives;
/** A primitive color-ramp name (e.g. `'neutral'`, `'blue'`). */
export type PrimitiveRamp = keyof Primitives;
