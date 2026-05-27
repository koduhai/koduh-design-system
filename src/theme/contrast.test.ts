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
