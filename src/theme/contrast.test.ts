import { describe, it, expect } from 'vitest';
import { themes, type ColorMode } from './tokens';

// WCAG 2.x relative-luminance contrast ratio. Mirrors the formula axe-core uses,
// so these assertions guard the same thing the e2e a11y suite enforces — but at
// the token level, before a component ever renders.
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;
const modes: ColorMode[] = ['dark', 'light'];
// The lightest (dark theme) / least-contrasting (light theme) surfaces a status
// element can sit on — the worst case for each theme.
const surfaces = ['bgDefault', 'bgSurface', 'bgRaised'] as const;
const fgTokens = ['successFg', 'warningFg', 'dangerFg', 'infoFg', 'accentFg'] as const;

describe('status foreground tokens meet WCAG AA as text', () => {
  for (const mode of modes) {
    for (const fg of fgTokens) {
      for (const surface of surfaces) {
        it(`${mode}: ${fg} on ${surface} >= ${AA_NORMAL}:1`, () => {
          const color = themes[mode].color;
          expect(contrast(color[fg], color[surface])).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    }
  }
});

describe('the selected-row tint stays legible (bg-selected = 16% primary wash)', () => {
  // bg-selected is a translucent brand wash (color-mix(primary 16%, transparent)),
  // so a selected row renders as 16% primary composited over whatever surface it
  // sits on. The wash is perceptible by construction; the real risk is text on the
  // tint, so assert textPrimary stays AA on a selected page row and raised row in
  // both themes. (Mirrors the Sidebar note about light-theme text nearly failing.)
  const TINT = 0.16;
  /** Composite `fg` at `alpha` over opaque `bg` (the rendered tint color). */
  function over(fg: string, bg: string, alpha: number): string {
    const channel = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i, i + 2), 16);
    const mix = (i: number) => Math.round(alpha * channel(fg, i) + (1 - alpha) * channel(bg, i));
    const h = (n: number) => n.toString(16).padStart(2, '0');
    return `#${h(mix(0))}${h(mix(2))}${h(mix(4))}`;
  }
  for (const mode of modes) {
    for (const surface of ['bgDefault', 'bgRaised'] as const) {
      it(`${mode}: textPrimary on a selected ${surface} row >= ${AA_NORMAL}:1`, () => {
        const color = themes[mode].color;
        const tinted = over(color.primary, color[surface], TINT);
        expect(contrast(color.textPrimary, tinted)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }
});

describe('solid tonal fills are AA against their contrast text', () => {
  // Chip/Button solid variants render <tone> as the fill with bgDefault as text.
  for (const mode of modes) {
    for (const tone of ['success', 'warning', 'danger', 'info', 'accent'] as const) {
      it(`${mode}: ${tone} fill + bgDefault text >= ${AA_NORMAL}:1`, () => {
        const color = themes[mode].color;
        expect(contrast(color[tone], color.bgDefault)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }
});
