import { useEffect, useState } from 'react';

// Standalone theme switch for the docs chrome. It writes the same data-theme
// attribute + localStorage key the design system's KoduhThemeProvider uses, so
// theme.css (scoped under [data-theme]) re-themes the whole static page, not
// just the React islands. We deliberately do NOT wrap the site in the provider:
// static Astro markup is outside any island's React tree, so an attribute on
// <html> is what makes global theming work.

type Mode = 'dark' | 'light';
const STORAGE_KEY = 'koduh-color-mode';

function currentMode(): Mode {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('dark');

  // Sync from the attribute the no-flash inline script already set pre-paint.
  useEffect(() => setMode(currentMode()), []);

  function toggle() {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // sandboxed / blocked storage: theming still works for the session.
    }
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--ku-space-2)',
        height: 36,
        padding: '0 var(--ku-space-3)',
        borderRadius: 'var(--ku-radius-md)',
        border: '1px solid var(--ku-color-border-default)',
        background: 'var(--ku-color-bg-default)',
        color: 'var(--ku-color-text-primary)',
        font: 'inherit',
        fontSize: 'var(--ku-font-size-sm)',
        cursor: 'pointer',
      }}
    >
      <span aria-hidden="true">{mode === 'dark' ? '☾' : '☀'}</span>
      {mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
