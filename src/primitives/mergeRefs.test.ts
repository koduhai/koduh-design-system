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
});
