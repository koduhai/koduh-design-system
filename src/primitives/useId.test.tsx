import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useId } from './useId';

describe('useId', () => {
  it('returns a string with the default prefix and no colons', () => {
    const { result } = renderHook(() => useId());
    expect(result.current.startsWith('ku-')).toBe(true);
    expect(result.current).not.toContain(':');
  });

  it('uses a custom prefix', () => {
    const { result } = renderHook(() => useId('field'));
    expect(result.current.startsWith('field-')).toBe(true);
  });

  it('is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useId());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
