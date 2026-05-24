import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import { Slot } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Grid.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

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

/** Fixed track count `repeat(n, …)`, or an explicit fr ratio when given an array. */
export type GridColumns = number | number[];

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Fixed track count: `repeat(columns, minmax(0, 1fr))`. Wins over `minItemWidth`.
   * Accepts a number, an fr-ratio array (`[1.1, 1]` → `1.1fr 1fr`), or a responsive
   * object (`{ base, sm, md, lg, xl }`) whose values are either of those.
   */
  columns?: ResponsiveValue<GridColumns>;
  /**
   * Auto-fit tracks: `repeat(auto-fit, minmax(minItemWidth, 1fr))`. Accepts a single
   * length or a responsive object. Only used at a breakpoint where `columns` is unset.
   */
  minItemWidth?: ResponsiveValue<string>;
  /** Space between cells. Defaults to 4. Accepts a token or a responsive object. */
  gap?: ResponsiveValue<SpaceToken>;
  asChild?: boolean;
}

function colsToTemplate(c: GridColumns): string {
  return Array.isArray(c) ? c.map((n) => `${n}fr`).join(' ') : `repeat(${c}, minmax(0, 1fr))`;
}

export const Grid = /* @__PURE__ */ forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, minItemWidth, gap = 4, asChild = false, className, style, ...props },
  ref,
) {
  const colsR = toResponsive<GridColumns>(columns);
  const minR = toResponsive<string>(minItemWidth);
  const gapR = toResponsive<SpaceToken>(gap);

  const vars: Record<string, string> = {};
  for (const bp of BREAKPOINTS) {
    const c = colsR[bp];
    const m = minR[bp];
    if (c != null) vars[`--grid-cols-${bp}`] = colsToTemplate(c);
    else if (m != null) vars[`--grid-cols-${bp}`] = `repeat(auto-fit, minmax(${m}, 1fr))`;
    const g = gapR[bp];
    if (g != null) vars[`--grid-gap-${bp}`] = `var(--ku-space-${g})`;
  }

  const classes = cx(styles.root, className);
  const mergedStyle = { ...vars, ...style } as CSSProperties;
  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} style={mergedStyle} {...props} />
    );
  }
  return <div ref={ref} className={classes} style={mergedStyle} {...props} />;
});
