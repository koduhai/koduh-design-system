import { test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDynamicVirtualizer } from './useDynamicVirtualizer';

// jsdom reports offsetHeight 0, so measurements are never cached and the hook
// falls back to the per-row estimate. That keeps these math assertions
// deterministic (the estimate is the height used throughout).

test('uniform-height window: start index, spacers, and total via the estimate fallback', () => {
  const { result } = renderHook(() =>
    useDynamicVirtualizer({
      count: 100,
      estimateHeight: () => 40,
      viewportHeight: 200,
      scrollTop: 0,
      overscan: 2,
      getItemKey: (i) => String(i),
    }),
  );
  // At scrollTop 0: firstVisible 0, walk fills 200px (rows 0..4), +overscan below.
  expect(result.current.startIndex).toBe(0);
  // lastVisible 5 (offset[5]=200 not < 200, stops at 5 after walking) + 1 + 2 overscan.
  expect(result.current.endIndex).toBeGreaterThanOrEqual(7);
  expect(result.current.topPad).toBe(0);
  expect(result.current.totalHeight).toBe(4000);
  // bottomPad accounts for every row below the window.
  expect(result.current.bottomPad).toBe(4000 - result.current.endIndex * 40);
});

test('binary-search start index after scrolling into the middle of the set', () => {
  const { result } = renderHook(() =>
    useDynamicVirtualizer({
      count: 100,
      estimateHeight: () => 40,
      viewportHeight: 200,
      scrollTop: 2000, // row 50 sits at the top (50 * 40)
      overscan: 2,
      getItemKey: (i) => String(i),
    }),
  );
  // firstVisible 50, minus overscan 2 → startIndex 48.
  expect(result.current.startIndex).toBe(48);
  // topPad = offset of startIndex = 48 * 40.
  expect(result.current.topPad).toBe(48 * 40);
});

test('mixed-height rows: offset and spacer math uses per-row estimates', () => {
  // Even rows 50px, odd rows 100px. Prefix offsets alternate accordingly.
  const estimateHeight = (i: number) => (i % 2 === 0 ? 50 : 100);
  const { result } = renderHook(() =>
    useDynamicVirtualizer({
      count: 10,
      estimateHeight,
      viewportHeight: 150,
      scrollTop: 0,
      overscan: 0,
      getItemKey: (i) => String(i),
    }),
  );
  // total = 5 * 50 + 5 * 100 = 750.
  expect(result.current.totalHeight).toBe(750);
  expect(result.current.startIndex).toBe(0);
  // Row 0 (0..50), Row 1 (50..150) — bottom 150 not < 150, so lastVisible = 1.
  // endIndex = lastVisible + 1 + overscan(0) = 2.
  expect(result.current.endIndex).toBe(2);
  // bottomPad = total - offset(endIndex=2) = 750 - 150 = 600.
  expect(result.current.bottomPad).toBe(600);
});

test('empty set yields a zero window', () => {
  const { result } = renderHook(() =>
    useDynamicVirtualizer({
      count: 0,
      estimateHeight: () => 40,
      viewportHeight: 200,
      scrollTop: 0,
      overscan: 2,
      getItemKey: (i) => String(i),
    }),
  );
  expect(result.current.startIndex).toBe(0);
  expect(result.current.endIndex).toBe(0);
  expect(result.current.totalHeight).toBe(0);
  expect(result.current.topPad).toBe(0);
  expect(result.current.bottomPad).toBe(0);
});
