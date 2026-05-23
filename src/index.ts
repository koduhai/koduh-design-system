// Provider + hooks
export { KoduhThemeProvider, useColorMode } from './provider';
export type { KoduhThemeProviderProps, ColorModeContextValue } from './provider';

// Primitives (public utilities reused by component consumers)
export {
  Slot,
  VisuallyHidden,
  mergeRefs,
  composeEventHandlers,
  useId,
  useControllableState,
} from './primitives';
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
export { Chip } from './components/Chip';
export type { ChipProps, ChipVariant, ChipTone, ChipSize } from './components/Chip';
export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize, AvatarShape } from './components/Avatar';
export { StatusBadge } from './components/StatusBadge';
export type {
  StatusBadgeProps,
  StatusBadgeStatus,
  StatusBadgeVariant,
} from './components/StatusBadge';
export { Alert } from './components/Alert';
export type { AlertProps, AlertSeverity } from './components/Alert';
export { TextField } from './components/TextField';
export type { TextFieldProps, TextFieldSize } from './components/TextField';
export { Card } from './components/Card';
export type { CardProps, CardVariant, CardPadding } from './components/Card';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, HeadingLevel } from './components/EmptyState';
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';
export { AppBar } from './components/AppBar';
export type { AppBarProps, AppBarPosition } from './components/AppBar';
export { Sidebar } from './components/Sidebar';
export type { SidebarProps, SidebarItem } from './components/Sidebar';
