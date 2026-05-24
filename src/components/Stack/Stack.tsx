import { forwardRef } from 'react';
import type { CSSProperties, ElementType, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Stack.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;
const BREAKPOINTS: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

/** Normalize a scalar-or-responsive prop to a breakpoint→value record. */
function toResponsive<T>(value: ResponsiveValue<T> | undefined): Partial<Record<Breakpoint, T>> {
  if (value == null) return {};
  if (typeof value === 'object' && !Array.isArray(value))
    return value as Partial<Record<Breakpoint, T>>;
  return { base: value as T };
}

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Space between children, from the --ku-space scale. Scalar or per-breakpoint. Defaults to 4. */
  gap?: ResponsiveValue<SpaceToken>;
  /** align-items. */
  align?: StackAlign;
  /** justify-content. */
  justify?: StackJustify;
  /** Allow children to wrap. */
  wrap?: boolean;
  /** Element to render. Ignored when asChild. Defaults to 'div'. */
  as?: ElementType;
  /** Render the single child instead of a <div>, merging props. */
  asChild?: boolean;
}

export const Stack = /* @__PURE__ */ forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = 4, align, justify, wrap, as, asChild = false, className, style, ...props },
  ref,
) {
  const classes = cx(styles.root, className);
  const gapR = toResponsive<SpaceToken>(gap);
  const vars: Record<string, string> = {};
  for (const bp of BREAKPOINTS) {
    const g = gapR[bp];
    if (g != null) vars[`--stack-gap-${bp}`] = `var(--ku-space-${g})`;
  }
  const mergedStyle = { ...vars, ...style } as CSSProperties;
  const dataAttrs = {
    'data-align': align,
    'data-justify': justify,
    'data-wrap': wrap ? '' : undefined,
  };
  if (asChild) {
    return (
      <Slot
        ref={ref as Ref<HTMLElement>}
        className={classes}
        style={mergedStyle}
        {...dataAttrs}
        {...props}
      />
    );
  }
  const Comp = (as ?? 'div') as ElementType;
  return (
    <Comp
      ref={ref as Ref<HTMLElement>}
      className={classes}
      style={mergedStyle}
      {...dataAttrs}
      {...props}
    />
  );
});
