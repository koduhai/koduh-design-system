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
});
