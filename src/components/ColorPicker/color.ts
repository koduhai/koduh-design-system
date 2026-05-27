/**
 * Pure color-math helpers for ColorPicker. No React, no DOM.
 * - RGB channels are 0–255; `a` (alpha) is 0–1.
 * - HSV: `h` in [0,360), `s`/`v` in [0,1]; `a` carried through unchanged.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
  a: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(clamp(n, 0, 255));

/**
 * Parse a CSS hex color. Accepts `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
 * (case-insensitive, leading `#` optional). Shorthand is expanded by repeating
 * each nibble. `a` defaults to 1. Returns null on anything else.
 */
export function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]+$/.test(s)) return null;

  let hex = s;
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (hex.length !== 6 && hex.length !== 8) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

const toByteHex = (n: number) => round(n).toString(16).padStart(2, '0').toUpperCase();

/**
 * Serialize RGB(A) to an uppercase hex string. Emits `#RRGGBB`, appending the
 * `AA` alpha pair only when `a` is defined and `< 1` (rounded to 0–255).
 */
export function toHex({ r, g, b, a }: RGB): string {
  const base = `#${toByteHex(r)}${toByteHex(g)}${toByteHex(b)}`;
  if (a === undefined || a >= 1) return base;
  return base + toByteHex(clamp(a, 0, 1) * 255);
}

/** Convert RGB (0–255) to HSV. Alpha is carried through (defaults to 1). */
export function rgbToHsv({ r, g, b, a = 1 }: RGB): HSV {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v, a };
}

/** Convert HSV to RGB (0–255). Alpha is carried through (defaults to 1). */
export function hsvToRgb({ h, s, v, a = 1 }: HSV): RGB {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) [rp, gp, bp] = [c, x, 0];
  else if (hh < 120) [rp, gp, bp] = [x, c, 0];
  else if (hh < 180) [rp, gp, bp] = [0, c, x];
  else if (hh < 240) [rp, gp, bp] = [0, x, c];
  else if (hh < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: round((rp + m) * 255),
    g: round((gp + m) * 255),
    b: round((bp + m) * 255),
    a,
  };
}
