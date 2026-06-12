import { createContext, useContext } from 'react';
import type { ColorMode, ColorScheme } from '../theme/tokens';

export interface ColorModeContextValue {
  /**
   * The resolved, concrete theme currently applied to the document
   * (`data-theme`). Always `'dark'` or `'light'` — never `'system'`. When the
   * {@link ColorModeContextValue.preference} is `'system'`, this reflects the OS
   * `prefers-color-scheme` and updates as the OS preference changes.
   */
  mode: ColorMode;
  /**
   * The user's color preference, including `'system'`. Use this (not `mode`) to
   * drive a 3-way toggle's active state. Persisted to localStorage.
   */
  preference: ColorScheme;
  /**
   * Set the color preference. Accepts `'system'` to follow the OS; `'dark'`/`'light'`
   * pin an explicit theme. Persisted (unless persistence is disabled).
   */
  setMode: (preference: ColorScheme) => void;
  /**
   * Backward-compatible 2-way switch between `'dark'` and `'light'`. Flips relative
   * to the currently resolved {@link ColorModeContextValue.mode}, so toggling out of
   * `'system'` pins the opposite of whatever the OS currently resolves to.
   */
  toggleMode: () => void;
  /**
   * 3-way cycle through the preference: `'dark'` → `'light'` → `'system'` → `'dark'`.
   * Convenience for a tri-state theme switcher.
   */
  cycleMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null);

/** Read and control the current color mode. Must be used within KoduhThemeProvider. */
export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode must be used within a KoduhThemeProvider');
  }
  return ctx;
}
