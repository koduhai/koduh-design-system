import { describe, it, expect } from 'vitest';
import koduhaiPreset, { koduhaiPreset as named } from './index';
import { themes } from '../theme/tokens';

describe('koduhaiPreset (Tailwind)', () => {
  const colors = koduhaiPreset.theme.extend.colors;

  it('exposes the same object as default and named export', () => {
    expect(named).toBe(koduhaiPreset);
  });

  it('maps semantic colors to --ku-color-* CSS variables (theme-reactive)', () => {
    expect(colors.primary.DEFAULT).toBe('var(--ku-color-primary)');
    expect(colors.primary.contrast).toBe('var(--ku-color-primary-contrast)');
    expect(colors.danger.fg).toBe('var(--ku-color-danger-fg)');
    expect(colors.border).toBe('var(--ku-color-border)');
  });

  it('renames bg/text tokens to avoid bg-bg-* / text-text-* utility names', () => {
    expect(colors.canvas).toBe('var(--ku-color-bg-default)');
    expect(colors.surface).toBe('var(--ku-color-bg-surface)');
    expect(colors.raised).toBe('var(--ku-color-bg-raised)');
    expect(colors.fg.DEFAULT).toBe('var(--ku-color-text-primary)');
    expect(colors.fg.muted).toBe('var(--ku-color-text-secondary)');
    expect(colors.fg.disabled).toBe('var(--ku-color-text-disabled)');
  });

  it('derives the full chart palette from the tokens (stays in sync)', () => {
    const chartCount = Object.keys(themes.dark.color).filter((k) => /^chart\d+$/.test(k)).length;
    expect(Object.keys(colors.chart)).toHaveLength(chartCount);
    expect(colors.chart['1']).toBe('var(--ku-color-chart-1)');
    expect(colors.chart[String(chartCount)]).toBe(`var(--ku-color-chart-${chartCount})`);
  });

  it('maps the font families to --ku-font-family-* variables', () => {
    expect(koduhaiPreset.theme.extend.fontFamily.sans).toBe('var(--ku-font-family-base)');
    expect(koduhaiPreset.theme.extend.fontFamily.mono).toBe('var(--ku-font-family-mono)');
  });

  it('does NOT override Tailwind built-in scales (spacing/radius/fontSize)', () => {
    const extend = koduhaiPreset.theme.extend as Record<string, unknown>;
    // Mapping these would clobber p-4, rounded-md, text-sm, … that consumers
    // already depend on — the preset deliberately leaves them to Tailwind.
    expect(extend.spacing).toBeUndefined();
    expect(extend.borderRadius).toBeUndefined();
    expect(extend.fontSize).toBeUndefined();
  });
});
