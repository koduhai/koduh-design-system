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
export { tokens, themes, density } from './theme';
export type { ColorMode, ColorScheme, ColorTokenName, Tokens, Density } from './theme';

// Utilities
export { cx } from './utils/cx';

// Components
// Phase 1–4 — v1.0 components
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
export { PasswordInput } from './components/PasswordInput';
export type { PasswordInputProps, PasswordInputSize } from './components/PasswordInput';
export { Card, CardHeader, CardBody, CardFooter } from './components/Card';
export type {
  CardProps,
  CardVariant,
  CardPadding,
  CardSlotProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
} from './components/Card';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, HeadingLevel } from './components/EmptyState';
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';
export { AppBar } from './components/AppBar';
export type { AppBarProps, AppBarPosition } from './components/AppBar';
export { Sidebar } from './components/Sidebar';
export type { SidebarProps, SidebarItem } from './components/Sidebar';

// Phase 5 — Tier 1 components
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps, CheckboxSize } from './components/Checkbox';
export { Radio, RadioGroup } from './components/Radio';
export type { RadioProps, RadioGroupProps } from './components/Radio';
export { Switch } from './components/Switch';
export type { SwitchProps, SwitchSize } from './components/Switch';
export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerTone } from './components/Spinner';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './components/Skeleton';
export { Divider } from './components/Divider';
export type { DividerProps } from './components/Divider';
export { Accordion } from './components/Accordion';
export type { AccordionProps, AccordionItemData } from './components/Accordion';
export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/Breadcrumbs';
export { Tabs } from './components/Tabs';
export type { TabsProps, TabItem } from './components/Tabs';

// Phase 6 — overlays (native <dialog> + Popover API)
export { Dialog, ConfirmDialog } from './components/Dialog';
export type { DialogProps, DialogSize, ConfirmDialogProps } from './components/Dialog';
export { Snackbar } from './components/Snackbar';
export type { SnackbarProps, SnackbarSeverity, SnackbarPlacement } from './components/Snackbar';

// Phase 7 — floating components (Popover API + CSS anchor positioning)
export { Popover } from './components/Popover';
export type { PopoverProps, PopoverPlacement } from './components/Popover';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';
export { Select } from './components/Select';
export type { SelectProps, SelectOption, SelectSize } from './components/Select';
export { Menu } from './components/Menu';
export type { MenuProps, MenuEntry, MenuItemConfig, MenuSeparator } from './components/Menu';

// Phase 8 — data & forms
export { Textarea } from './components/Textarea';
export type { TextareaProps, TextareaSize } from './components/Textarea';
export { Progress } from './components/Progress';
export type { ProgressProps, ProgressSize, ProgressTone } from './components/Progress';
export { Pagination, getPaginationRange } from './components/Pagination';
export type {
  PaginationProps,
  PaginationItem,
  PaginationRangeOptions,
} from './components/Pagination';
export { Table } from './components/Table';
export type { TableProps, Column, SortDirection, SortRule, CellAlign } from './components/Table';

// Phase 9 — DataTable (stateful Table orchestrator)
export { DataTable } from './components/DataTable';
export type {
  DataTableProps,
  DataColumn,
  ColumnType,
  ColumnWidths,
  DataTableState,
  EmptyStateContext,
  FilterKind,
  FilterValue,
  FilterState,
} from './components/DataTable';

// v2 issues #13/#14/#15 — layout/typography primitives, notifications, form layer
// Layout + typography
export { Stack } from './components/Stack';
export type { StackProps, SpaceToken, StackAlign, StackJustify } from './components/Stack';
export { Inline } from './components/Inline';
export type { InlineProps, InlineAlign, InlineJustify } from './components/Inline';
export { Grid } from './components/Grid';
export type { GridProps } from './components/Grid';
export { Container } from './components/Container';
export type { ContainerProps, ContainerSize } from './components/Container';
export { Text } from './components/Text';
export type {
  TextProps,
  TextSize,
  TextWeight,
  TextTone,
  TextLeading,
  TextFamily,
  TextNumeric,
  TextTransform,
} from './components/Text';
export { Heading } from './components/Heading';
export type {
  HeadingProps,
  HeadingSize,
  HeadingWeight,
  HeadingLeading,
} from './components/Heading';
export { Box } from './components/Box';
export type { BoxProps } from './components/Box';
export { DescriptionList } from './components/DescriptionList';
export type { DescriptionListProps, DescriptionItem } from './components/DescriptionList';
export { Link } from './components/Link';
export type { LinkProps, LinkTone, LinkUnderline } from './components/Link';
// Notifications
export { Toaster, useToast } from './components/Toaster';
export type {
  ToasterProps,
  ToasterPlacement,
  UseToastReturn,
  ToastOptions,
  ToastRecord,
  ToastSeverity,
} from './components/Toaster';
export { NotificationBadge } from './components/NotificationBadge';
export type {
  NotificationBadgeProps,
  NotificationBadgePlacement,
} from './components/NotificationBadge';
// Form layer
export {
  FormField,
  useField,
  useFieldContext,
  useOptionalFieldContext,
} from './components/FormField';
export type {
  FormFieldProps,
  FieldBinding,
  FieldContextValue,
  UseFieldOptions,
  UseFieldResult,
} from './components/FormField';
export { NumberField } from './components/NumberField';
export type { NumberFieldProps, NumberFieldSize } from './components/NumberField';
export { Slider } from './components/Slider';
export type { SliderProps, SliderSize } from './components/Slider';
export { TagInput } from './components/TagInput';
export type { TagInputProps, TagInputSize } from './components/TagInput';
export { Combobox } from './components/Combobox';
export type { ComboboxProps, ComboboxOption, ComboboxSize } from './components/Combobox';

// issue #12 — AvatarGroup, Stat, ToggleGroup, Drawer
export { AvatarGroup } from './components/AvatarGroup';
export type { AvatarGroupProps } from './components/AvatarGroup';
export { Stat } from './components/Stat';
export type { StatProps, StatTrend } from './components/Stat';
export { ToggleGroup } from './components/ToggleGroup';
export type {
  ToggleGroupProps,
  ToggleGroupItem,
  ToggleGroupSize,
  ToggleGroupTone,
} from './components/ToggleGroup';
export { Drawer } from './components/Drawer';
export type { DrawerProps, DrawerSide, DrawerSize } from './components/Drawer';

// issues #27/#28/#31/#32 — date input, data-viz, P2 components
export { Calendar } from './components/Calendar';
export type { CalendarProps } from './components/Calendar';
export { DatePicker } from './components/DatePicker';
export type { DatePickerProps, DatePickerSize } from './components/DatePicker';
export { Sparkline } from './components/Sparkline';
export type { SparklineProps, SparklineType } from './components/Sparkline';
export { Chart } from './components/Chart';
export type { ChartProps, ChartType, ChartSeries } from './components/Chart';
export { Kbd } from './components/Kbd';
export type { KbdProps, KbdSize } from './components/Kbd';
export { AspectRatio } from './components/AspectRatio';
export type { AspectRatioProps } from './components/AspectRatio';
export { Code, CodeBlock } from './components/Code';
export type { CodeProps, CodeBlockProps } from './components/Code';
export { Collapsible } from './components/Collapsible';
export type { CollapsibleProps } from './components/Collapsible';
export { CountUp } from './components/CountUp';
export type { CountUpProps } from './components/CountUp';
export { ScrollArea } from './components/ScrollArea';
export type { ScrollAreaProps, ScrollAreaOrientation } from './components/ScrollArea';
export { Rating } from './components/Rating';
export type { RatingProps, RatingSize } from './components/Rating';
export { Stepper } from './components/Stepper';
export type { StepperProps, StepperStep, StepperOrientation, StepState } from './components/Stepper';
export { Timeline } from './components/Timeline';
export type { TimelineProps, TimelineItem } from './components/Timeline';
export { HoverCard } from './components/HoverCard';
export type { HoverCardProps } from './components/HoverCard';
export { PinInput } from './components/PinInput';
export type { PinInputProps, PinInputSize } from './components/PinInput';
export { FileUpload } from './components/FileUpload';
export type { FileUploadProps } from './components/FileUpload';
export { Tree } from './components/Tree';
export type { TreeProps, TreeNode } from './components/Tree';
export { Carousel } from './components/Carousel';
export type { CarouselProps, CarouselItem } from './components/Carousel';
export { CommandPalette } from './components/CommandPalette';
export type { CommandPaletteProps, CommandPaletteCommand } from './components/CommandPalette';

// Form orchestration (#38)
export {
  Form,
  useForm,
  useFormContext,
  useOptionalFormContext,
  useFormField,
  useFieldArray,
  FormErrorSummary,
  standardSchemaResolver,
} from './components/Form';
export type {
  FormProps,
  FormApi,
  UseFormOptions,
  FieldRules,
  FieldState,
  FormState,
  ValidationMode,
  FormValues,
  FormErrors,
  UseFormFieldResult,
  UseFieldArrayResult,
  FieldArrayItem,
  FormErrorSummaryProps,
  Resolver,
  ResolverResult,
  StandardSchemaV1,
} from './components/Form';
