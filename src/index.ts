// Provider + hooks
export { KoduhThemeProvider, useColorMode } from './provider';
export type { KoduhThemeProviderProps, ColorModeContextValue } from './provider';

// Primitives (public utilities reused by component consumers)
export { Slot, VisuallyHidden, mergeRefs, composeEventHandlers, useId, useControllableState } from './primitives';
export type { SlotProps } from './primitives';

// Theme tokens
export { tokens, themes } from './theme';
export type { ColorMode, ColorTokenName, Tokens } from './theme';

// Utilities
export { cx } from './utils/cx';

// Components
// NOTE: the 12 components are exported here as they are built in Phases 1–4.
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize } from './components/Button';
export { LoadingButton } from './components/LoadingButton';
export type { LoadingButtonProps } from './components/LoadingButton';
