import { createContext, useContext } from 'react';
import type { ColorMode } from '../theme/tokens';

export interface ColorModeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
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
