import type { Ref, MutableRefObject } from 'react';

/**
 * Combine multiple refs into one callback ref.
 *
 * Returns a cleanup function so React 19 ref-cleanup semantics are preserved:
 * for each callback ref that returns its own cleanup, that cleanup is invoked on
 * detach; refs that return nothing fall back to being called with null.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => () => void {
  return (node) => {
    const cleanups = new Map<(node: T | null) => unknown, () => void>();

    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        if (typeof cleanup === 'function') {
          cleanups.set(ref, cleanup as () => void);
        }
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }

    return () => {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          const cleanup = cleanups.get(ref);
          if (cleanup) {
            cleanup();
          } else {
            ref(null);
          }
        } else if (ref) {
          (ref as MutableRefObject<T | null>).current = null;
        }
      }
    };
  };
}
