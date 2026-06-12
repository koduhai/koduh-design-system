import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useControllableState } from './useControllableState';

describe('useControllableState', () => {
  it('manages internal state when uncontrolled', () => {
    const { result } = renderHook(() => useControllableState<string>({ defaultValue: 'a' }));
    expect(result.current[0]).toBe('a');
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
  });

  it('respects a controlled value and does not change it internally', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>({ value: 'fixed', onChange }));
    expect(result.current[0]).toBe('fixed');
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('fixed');
    expect(onChange).toHaveBeenCalledWith('next');
  });

  it('calls onChange in uncontrolled mode too', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<string>({ defaultValue: 'a', onChange }),
    );
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
