import { describe, it, expect } from 'vitest';
import { buildThemeCss } from './generate-theme-css';

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('declares scale variables on :root', () => {
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toContain('--ku-space-1: 4px;');
    expect(css).toContain('--ku-radius-md:');
  });

  it('declares dark theme as the default on :root and [data-theme="dark"]', () => {
    expect(css).toContain('--ku-color-bg-default: #0A0E1A;');
    expect(css).toMatch(/\[data-theme="dark"\]/);
  });

  it('declares light theme overrides under [data-theme="light"]', () => {
    expect(css).toMatch(/\[data-theme="light"\]\s*\{[^}]*--ku-color-bg-default: #FFFFFF;/s);
  });

  it('converts camelCase token names to kebab-case variables', () => {
    expect(css).toContain('--ku-color-text-primary:');
    expect(css).toContain('--ku-color-bg-surface:');
  });

  it('declares comfortable density vars on :root by default', () => {
    expect(css).toMatch(
      /:root\s*\{[^}]*--ku-density-control-padding-y: 8px;[^}]*--ku-density-row-height: 40px;/s,
    );
    expect(css).toContain('--ku-density-control-padding-x: 12px;');
    expect(css).toContain('--ku-density-row-padding-y: 8px;');
    expect(css).toContain('--ku-density-row-padding-x: 12px;');
  });

  it('overrides density vars with tighter values under [data-density="compact"]', () => {
    expect(css).toMatch(
      /\[data-density='compact'\]\s*\{[^}]*--ku-density-control-padding-y: 4px;[^}]*--ku-density-row-height: 32px;/s,
    );
    expect(css).toMatch(
      /\[data-density='compact'\]\s*\{[^}]*--ku-density-control-padding-x: 8px;/s,
    );
  });

  it('emits an explicit [data-density="comfortable"] block so density can be reset under a compact ancestor', () => {
    expect(css).toMatch(/\[data-density='comfortable'\]\s*\{[^}]*--ku-density-row-height: 40px;/s);
  });
});
