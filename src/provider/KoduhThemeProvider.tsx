import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColorMode, ColorScheme } from '../theme/tokens';
import { ColorModeContext } from './useColorMode';
import '../styles/reset.css';
import '../styles/focus-ring.css';

const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Theme used when `'system'` is requested but `matchMedia` is unavailable (SSR/older envs). */
const SYSTEM_FALLBACK: ColorMode = 'dark';

export interface KoduhThemeProviderProps {
  children: ReactNode;
  /**
   * Initial preference when nothing is persisted. Accepts `'system'` to follow the
   * OS `prefers-color-scheme`. Defaults to `'dark'`.
   */
  defaultMode?: ColorScheme;
  /** localStorage key for persistence. */
  storageKey?: string;
  /** Disable reading/writing localStorage. */
  disablePersistence?: boolean;
}

function isColorScheme(value: string | null): value is ColorScheme {
  return value === 'dark' || value === 'light' || value === 'system';
}

function readStoredPreference(storageKey: string, fallback: ColorScheme): ColorScheme {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return isColorScheme(stored) ? stored : fallback;
}

/** Resolve a preference into a concrete theme, reading the OS scheme for `'system'`. */
function resolveMode(preference: ColorScheme): ColorMode {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return SYSTEM_FALLBACK;
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function KoduhThemeProvider({
  children,
  defaultMode = 'dark',
  storageKey = 'koduh-color-mode',
  disablePersistence = false,
}: KoduhThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ColorScheme>(() =>
    disablePersistence ? defaultMode : readStoredPreference(storageKey, defaultMode),
  );
  const [systemMode, setSystemMode] = useState<ColorMode>(() => resolveMode('system'));

  // The resolved theme: the OS scheme while in 'system', otherwise the explicit value.
  const mode: ColorMode = preference === 'system' ? systemMode : preference;

  // Subscribe to OS scheme changes only while following the system preference.
  useEffect(() => {
    if (preference !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(DARK_QUERY);
    setSystemMode(mql.matches ? 'dark' : 'light');
    const onChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [preference]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const persist = useCallback(
    (next: ColorScheme) => {
      if (!disablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [disablePersistence, storageKey],
  );

  const setMode = useCallback(
    (next: ColorScheme) => {
      setPreferenceState(next);
      persist(next);
    },
    [persist],
  );

  const toggleMode = useCallback(() => {
    // Backward-compatible 2-way flip against the currently resolved theme.
    setPreferenceState((prev) => {
      const resolved = prev === 'system' ? resolveMode('system') : prev;
      const next: ColorScheme = resolved === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, [persist]);

  const cycleMode = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ColorScheme = prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark';
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(
    () => ({ mode, preference, setMode, toggleMode, cycleMode }),
    [mode, preference, setMode, toggleMode, cycleMode],
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}
