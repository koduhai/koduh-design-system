import { describe, it, expect } from 'vitest';
import { parseHex, toHex, hsvToRgb, rgbToHsv } from './color';

describe('color helpers', () => {
  it('parses 3/6/8-digit hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseHex('#1B5FCC')).toEqual({ r: 27, g: 95, b: 204, a: 1 });
    expect(parseHex('#1B5FCC80')!.a).toBeCloseTo(0.5, 1);
  });
  it('returns null for invalid hex', () => {
    expect(parseHex('nope')).toBeNull();
  });
  it('serializes to #RRGGBB and #RRGGBBAA', () => {
    expect(toHex({ r: 27, g: 95, b: 204, a: 1 })).toBe('#1B5FCC');
    expect(toHex({ r: 27, g: 95, b: 204, a: 0.5 })).toBe('#1B5FCC80');
  });
  it('round-trips rgb<->hsv', () => {
    const rgb = { r: 27, g: 95, b: 204 };
    const hsv = rgbToHsv(rgb);
    const back = hsvToRgb(hsv);
    expect(back.r).toBeCloseTo(27, 0);
    expect(back.g).toBeCloseTo(95, 0);
    expect(back.b).toBeCloseTo(204, 0);
  });
});
