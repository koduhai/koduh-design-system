import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KoduhThemeProvider } from './KoduhThemeProvider';
import { useColorMode } from './useColorMode';

function ModeProbe() {
  const { mode, preference, setMode, toggleMode, cycleMode } = useColorMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="preference">{preference}</span>
      <button onClick={toggleMode}>toggle</button>
      <button onClick={cycleMode}>cycle</button>
      <button onClick={() => setMode('system')}>set-system</button>
      <button onClick={() => setMode('light')}>set-light</button>
      <button onClick={() => setMode('dark')}>set-dark</button>
    </div>
  );
}

/**
 * Installs a controllable `window.matchMedia` mock for the dark-scheme query.
 * Returns a handle that lets a test flip the OS preference and fire `change`.
 */
function mockMatchMedia(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  const fn = vi.fn().mockReturnValue(mql);
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: fn });
  return {
    mql,
    setOsDark(next: boolean) {
      matches = next;
      act(() => {
        listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
      });
    },
  };
}

describe('KoduhThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark and sets data-theme on the document element', () => {
    render(
      <KoduhThemeProvider>
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('preference').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('honors an explicit defaultMode', () => {
    render(
      <KoduhThemeProvider defaultMode="light">
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggles and persists the mode to localStorage', async () => {
    render(
      <KoduhThemeProvider>
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(window.localStorage.getItem('koduh-color-mode')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('restores a persisted mode on mount', () => {
    window.localStorage.setItem('koduh-color-mode', 'light');
    render(
      <KoduhThemeProvider defaultMode="dark">
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('throws when useColorMode is used outside the provider', () => {
    const Broken = () => {
      useColorMode();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/useColorMode/);
  });

  describe('system color mode', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('resolves the theme from prefers-color-scheme when preference is system (dark OS)', () => {
      mockMatchMedia(true);
      render(
        <KoduhThemeProvider defaultMode="system">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      expect(screen.getByTestId('preference').textContent).toBe('system');
      expect(screen.getByTestId('mode').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('resolves to light from prefers-color-scheme when preference is system (light OS)', () => {
      mockMatchMedia(false);
      render(
        <KoduhThemeProvider defaultMode="system">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      expect(screen.getByTestId('mode').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('reacts to OS scheme change events while in system mode', () => {
      const mm = mockMatchMedia(false);
      render(
        <KoduhThemeProvider defaultMode="system">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      expect(screen.getByTestId('mode').textContent).toBe('light');
      mm.setOsDark(true);
      expect(screen.getByTestId('mode').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('persists the system preference, not the resolved value', async () => {
      mockMatchMedia(true);
      render(
        <KoduhThemeProvider>
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'set-system' }));
      expect(window.localStorage.getItem('koduh-color-mode')).toBe('system');
      expect(screen.getByTestId('preference').textContent).toBe('system');
      expect(screen.getByTestId('mode').textContent).toBe('dark');
    });

    it('restores a persisted system preference on mount', () => {
      window.localStorage.setItem('koduh-color-mode', 'system');
      mockMatchMedia(true);
      render(
        <KoduhThemeProvider defaultMode="light">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      expect(screen.getByTestId('preference').textContent).toBe('system');
      expect(screen.getByTestId('mode').textContent).toBe('dark');
    });

    it('stops reacting to OS changes after switching away from system', async () => {
      const mm = mockMatchMedia(true);
      render(
        <KoduhThemeProvider defaultMode="system">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      expect(screen.getByTestId('mode').textContent).toBe('dark');
      await userEvent.click(screen.getByRole('button', { name: 'set-light' }));
      expect(screen.getByTestId('preference').textContent).toBe('light');
      expect(screen.getByTestId('mode').textContent).toBe('light');
      // An OS flip must no longer override the explicit preference.
      mm.setOsDark(true);
      expect(screen.getByTestId('mode').textContent).toBe('light');
    });

    it('cycleMode steps dark -> light -> system -> dark', async () => {
      mockMatchMedia(true);
      render(
        <KoduhThemeProvider defaultMode="dark">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      const cycle = screen.getByRole('button', { name: 'cycle' });
      expect(screen.getByTestId('preference').textContent).toBe('dark');
      await userEvent.click(cycle);
      expect(screen.getByTestId('preference').textContent).toBe('light');
      await userEvent.click(cycle);
      expect(screen.getByTestId('preference').textContent).toBe('system');
      await userEvent.click(cycle);
      expect(screen.getByTestId('preference').textContent).toBe('dark');
    });

    it('toggleMode remains a 2-way dark/light switch from system', async () => {
      mockMatchMedia(true);
      render(
        <KoduhThemeProvider defaultMode="system">
          <ModeProbe />
        </KoduhThemeProvider>,
      );
      // Resolved is dark; toggling flips the resolved theme to light explicitly.
      await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
      expect(screen.getByTestId('preference').textContent).toBe('light');
      expect(screen.getByTestId('mode').textContent).toBe('light');
    });

    it('falls back gracefully when matchMedia is unavailable', () => {
      // Remove matchMedia entirely (older/SSR-ish environments).
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: undefined,
      });
      window.localStorage.setItem('koduh-color-mode', 'system');
      expect(() =>
        render(
          <KoduhThemeProvider defaultMode="dark">
            <ModeProbe />
          </KoduhThemeProvider>,
        ),
      ).not.toThrow();
      // With no matchMedia, system resolves to the dark fallback.
      expect(screen.getByTestId('preference').textContent).toBe('system');
      expect(screen.getByTestId('mode').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
