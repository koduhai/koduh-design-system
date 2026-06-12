import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** A measured row's ref-callback target. */
type MeasureTarget = HTMLElement | null;

export interface DynamicVirtualizerOptions {
  /** Total number of windowed rows. */
  count: number;
  /** Per-row pre-measurement height estimate (px). */
  estimateHeight: (index: number) => number;
  /** Visible viewport height (px). */
  viewportHeight: number;
  /** Current scroll offset (px) of the viewport. */
  scrollTop: number;
  /** Extra rows rendered above/below the window to smooth fast scrolling. */
  overscan: number;
  /**
   * Stable row id for the row at `index`. Keying the measured-height cache by id
   * (not index) lets cached heights survive sort/filter reorder.
   */
  getItemKey: (index: number) => string;
  /**
   * How to read the rendered height of a measured node. Defaults to
   * `node.offsetHeight`. The expandable variant overrides this to sum the main
   * `<tr>` and its sibling detail `<tr>` so expanding a row grows its measured
   * height.
   */
  measureNode?: (node: HTMLElement) => number;
  /**
   * When true, the ref also observes the measured node's next element sibling
   * (the detail `<tr>`) so an expand/collapse — which resizes the sibling, not the
   * main row — still triggers a re-measure. Pair with `measureNode` to sum both.
   */
  observeSibling?: boolean;
}

export interface DynamicVirtualizerResult {
  /** First windowed row index to mount (already includes overscan). */
  startIndex: number;
  /** One-past-last windowed row index to mount (already includes overscan). */
  endIndex: number;
  /** Spacer height (px) standing in for rows above `startIndex`. */
  topPad: number;
  /** Spacer height (px) standing in for rows below `endIndex`. */
  bottomPad: number;
  /** Sum of all (measured-or-estimated) row heights. */
  totalHeight: number;
  /** Returns a ref callback that measures the row at `index` into the cache. */
  measureRef: (index: number) => (node: MeasureTarget) => void;
}

/** Heights closer than this (px) are treated as unchanged to avoid feedback loops. */
const EPSILON = 0.5;

/**
 * Estimate + measured-height windowing for variable-height rows.
 *
 * Maintains a `Map<rowKey, number>` of measured heights and a prefix-offset array
 * (recomputed when measurements/count/estimates change). `scrollTop` is binary-
 * searched against the offsets to find the first visible row, then rows are walked
 * forward accumulating heights until the viewport is filled; `overscan` rows are
 * added on each side. Spacers (`topPad`/`bottomPad`) stand in for the unmounted
 * rows so the scrollbar stays correct.
 *
 * Measurement uses ResizeObserver where available and falls back to
 * `getBoundingClientRect` in a layout effect (jsdom has no ResizeObserver). A
 * measured height of 0 (common in jsdom) is ignored so the estimate is kept.
 */
export function useDynamicVirtualizer({
  count,
  estimateHeight,
  viewportHeight,
  scrollTop,
  overscan,
  getItemKey,
  measureNode,
  observeSibling = false,
}: DynamicVirtualizerOptions): DynamicVirtualizerResult {
  // Measured heights keyed by stable row id. A bump counter forces recompute of
  // the offset memo on a mutation (the Map is mutated in place to keep the ref
  // identity stable across the ResizeObserver lifetime).
  const measuredRef = useRef<Map<string, number>>(new Map());
  const [version, setVersion] = useState(0);

  // getItemKey/estimateHeight may be fresh closures each render; read them through
  // refs so the stable measureRef callback doesn't churn observers every render.
  const getItemKeyRef = useRef(getItemKey);
  getItemKeyRef.current = getItemKey;
  const estimateRef = useRef(estimateHeight);
  estimateRef.current = estimateHeight;
  const measureNodeRef = useRef(measureNode);
  measureNodeRef.current = measureNode;
  const readHeight = useCallback(
    (node: HTMLElement): number =>
      measureNodeRef.current ? measureNodeRef.current(node) : node.offsetHeight,
    [],
  );

  const heightFor = useCallback(
    (index: number): number => {
      const key = getItemKeyRef.current(index);
      const measured = measuredRef.current.get(key);
      return measured != null ? measured : estimateRef.current(index);
    },
    // heightFor reads everything through refs + the version bump, so it only needs
    // to change when a measurement lands (version) or the row set resizes (count).
    [version, count],
  );

  // Prefix offsets: offsets[i] is the cumulative height of rows [0, i). The array
  // has length count + 1 so offsets[count] is the total height.
  const offsets = useMemo(() => {
    const arr = new Array<number>(count + 1);
    arr[0] = 0;
    for (let i = 0; i < count; i++) {
      arr[i + 1] = arr[i]! + heightFor(i);
    }
    return arr;
  }, [count, heightFor]);

  const totalHeight = offsets[count] ?? 0;

  // Binary-search the first row whose end offset exceeds scrollTop.
  const firstVisible = useMemo(() => {
    if (count === 0) return 0;
    let lo = 0;
    let hi = count - 1;
    let result = count - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      // offsets[mid + 1] is the bottom edge of row `mid`.
      if (offsets[mid + 1]! > scrollTop) {
        result = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return result;
  }, [offsets, scrollTop, count]);

  // Walk forward from the first visible row until the viewport bottom is covered.
  const lastVisible = useMemo(() => {
    if (count === 0) return 0;
    const bottom = scrollTop + viewportHeight;
    let i = firstVisible;
    while (i < count - 1 && offsets[i + 1]! < bottom) {
      i++;
    }
    return i;
  }, [offsets, firstVisible, scrollTop, viewportHeight, count]);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(count, lastVisible + 1 + overscan);
  const topPad = offsets[startIndex] ?? 0;
  const bottomPad = Math.max(0, totalHeight - (offsets[endIndex] ?? totalHeight));

  // Stable observer registry: one ResizeObserver shared across rows, with a node→key
  // lookup so a callback can write the right cache entry.
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeKeyRef = useRef<WeakMap<Element, string>>(new WeakMap());

  const writeHeight = useCallback((key: string, height: number) => {
    // jsdom layout returns 0; keep the estimate rather than caching a bogus 0.
    if (height <= 0) return;
    const prev = measuredRef.current.get(key);
    if (prev != null && Math.abs(prev - height) < EPSILON) return;
    measuredRef.current.set(key, height);
    setVersion((v) => v + 1);
  }, []);

  const getObserver = useCallback((): ResizeObserver | null => {
    if (typeof ResizeObserver === 'undefined') return null;
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const key = nodeKeyRef.current.get(entry.target);
          if (key == null) continue;
          writeHeight(key, readHeight(entry.target as HTMLElement));
        }
      });
    }
    return observerRef.current;
  }, [writeHeight]);

  // Ref callbacks memoized by stable row key so React doesn't detach/reattach
  // (and re-observe) on a plain re-render, and so a sort reorder (which keeps the
  // id-keyed <tr> mounted) doesn't churn the observer. The callback resolves its
  // key once at attach time.
  const callbacksRef = useRef<Map<string, (node: MeasureTarget) => void>>(new Map());

  const measureRef = useCallback(
    (index: number) => {
      const key = getItemKeyRef.current(index);
      const cached = callbacksRef.current.get(key);
      if (cached) return cached;
      const cb = (node: MeasureTarget) => {
        const observer = getObserver();
        if (node) {
          nodeKeyRef.current.set(node, key);
          observer?.observe(node);
          // Also observe the detail sibling so an expand/collapse (which resizes
          // the sibling, not the main row) fires the observer and re-measures.
          const sibling = observeSibling ? (node.nextElementSibling as HTMLElement | null) : null;
          if (sibling) {
            nodeKeyRef.current.set(sibling, key);
            observer?.observe(sibling);
          }
          // Synchronous first measure so the offsets converge without waiting on
          // an observer tick (and works at all in jsdom, which has no observer).
          writeHeight(key, readHeight(node));
        } else {
          // Row left the window: drop the per-key callback so a remount re-observes.
          callbacksRef.current.delete(key);
        }
      };
      callbacksRef.current.set(key, cb);
      return cb;
    },
    [getObserver, writeHeight, readHeight, observeSibling],
  );

  // Tear down the shared observer on unmount.
  useLayoutEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return { startIndex, endIndex, topPad, bottomPad, totalHeight, measureRef };
}
