import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColorMode } from '../theme/tokens';
import { ColorModeContext } from './useColorMode';
import '../styles/reset.css';
import '../styles/focus-ring.css';

export interface KoduhThemeProviderProps {
  children: ReactNode;
  /** Initial mode when nothing is persisted. Defaults to 'dark'. */
  defaultMode?: ColorMode;
  /** localStorage key for persistence. */
  storageKey?: string;
  /** Disable reading/writing localStorage. */
  disablePersistence?: boolean;
}

function readStoredMode(storageKey: string, fallback: ColorMode): ColorMode {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'dark' || stored === 'light' ? stored : fallback;
}

export function KoduhThemeProvider({
  children,
  defaultMode = 'dark',
  storageKey = 'koduh-color-mode',
  disablePersistence = false,
}: KoduhThemeProviderProps) {
  const [mode, setModeState] = useState<ColorMode>(() =>
    disablePersistence ? defaultMode : readStoredMode(storageKey, defaultMode),
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next);
      if (!disablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [disablePersistence, storageKey],
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (!disablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
      }
      return next;
    });
  }, [disablePersistence, storageKey]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}
