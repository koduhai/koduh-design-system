import { describe, it, expect } from 'vitest';
import { tokens, themes } from './tokens';

describe('tokens', () => {
  it('exposes the core token scales', () => {
    expect(tokens.space[1]).toBe('4px');
    expect(tokens.radius.md).toBeTruthy();
    expect(Object.keys(tokens.fontSize).length).toBeGreaterThan(0);
  });

  it('defines both dark and light themes with matching color keys', () => {
    const darkKeys = Object.keys(themes.dark.color).sort();
    const lightKeys = Object.keys(themes.light.color).sort();
    expect(darkKeys).toEqual(lightKeys);
    expect(darkKeys).toContain('primary');
    expect(darkKeys).toContain('bgDefault');
    expect(darkKeys).toContain('textPrimary');
  });

  it('dark is the default-documented primary theme', () => {
    expect(themes.dark.color.bgDefault).toMatch(/^#/);
    expect(themes.light.color.bgDefault).toMatch(/^#/);
    expect(themes.dark.color.bgDefault).not.toBe(themes.light.color.bgDefault);
  });
});
