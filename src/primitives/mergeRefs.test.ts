import { describe, it, expect, vi } from 'vitest';
import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  it('assigns the node to object refs and calls function refs', () => {
    const objectRef = { current: null as string | null };
    const fnRef = vi.fn();
    const merged = mergeRefs(objectRef, fnRef);

    merged('node');

    expect(objectRef.current).toBe('node');
    expect(fnRef).toHaveBeenCalledWith('node');
  });

  it('ignores null and undefined refs', () => {
    const merged = mergeRefs<string>(null, undefined);
    expect(() => merged('node')).not.toThrow();
  });

  it('invokes a callback ref cleanup on detach instead of calling it with null', () => {
    const cleanup = vi.fn();
    const fnRef = vi.fn(() => cleanup);
    const merged = mergeRefs<string>(fnRef);

    const detach = merged('node');
    expect(fnRef).toHaveBeenCalledWith('node');

    detach();
    expect(cleanup).toHaveBeenCalledTimes(1);
    // The cleanup path replaces the legacy ref(null) call.
    expect(fnRef).not.toHaveBeenCalledWith(null);
  });

  it('falls back to ref(null) on detach for callback refs without a cleanup', () => {
    const fnRef = vi.fn();
    const merged = mergeRefs<string>(fnRef);

    const detach = merged('node');
    detach();

    expect(fnRef).toHaveBeenNthCalledWith(1, 'node');
    expect(fnRef).toHaveBeenNthCalledWith(2, null);
  });

  it('resets object refs to null on detach', () => {
    const objectRef = { current: null as string | null };
    const merged = mergeRefs<string>(objectRef);

    const detach = merged('node');
    expect(objectRef.current).toBe('node');

    detach();
    expect(objectRef.current).toBeNull();
  });

  it('mixes cleanup-returning and plain refs on detach', () => {
    const cleanup = vi.fn();
    const cleanupRef = vi.fn(() => cleanup);
    const plainRef = vi.fn();
    const objectRef = { current: null as string | null };
    const merged = mergeRefs<string>(cleanupRef, plainRef, objectRef);

    const detach = merged('node');
    detach();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(cleanupRef).not.toHaveBeenCalledWith(null);
    expect(plainRef).toHaveBeenNthCalledWith(2, null);
    expect(objectRef.current).toBeNull();
  });
});
