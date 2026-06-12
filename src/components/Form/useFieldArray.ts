import { useMemo, useRef, useSyncExternalStore } from 'react';
import { get } from './path';
import { useFormContext } from './FormContext';

export interface FieldArrayItem {
  id: string;
}

export interface UseFieldArrayResult<T = Record<string, unknown>> {
  fields: Array<T & FieldArrayItem>;
  append: (value: T) => void;
  prepend: (value: T) => void;
  insert: (index: number, value: T) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  replace: (values: T[]) => void;
}

let arrayItemCounter = 0;
function nextId(): string {
  arrayItemCounter += 1;
  return `fa_${arrayItemCounter}`;
}

const EMPTY: never[] = [];

export function useFieldArray<T = Record<string, unknown>>(name: string): UseFieldArrayResult<T> {
  const api = useFormContext();

  const values = useSyncExternalStore(
    api.subscribe,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
  );

  // The mutators (append/insert/…) own the id list: they write the exact ids
  // alongside the new values via `pendingIdsRef`. Render-time reconciliation is a
  // *fallback* for value changes that didn't flow through a mutator (reset,
  // programmatic setValue): it preserves existing ids by index and mints only for
  // the trailing surplus. Keeping the ref mutation inside `useMemo` (idempotent on
  // the same `values`) avoids burning ids under StrictMode's double render.
  const idsRef = useRef<string[]>([]);
  const pendingIdsRef = useRef<string[] | null>(null);

  const ids = useMemo<string[]>(() => {
    if (pendingIdsRef.current) {
      const taken = pendingIdsRef.current;
      pendingIdsRef.current = null;
      idsRef.current = taken;
      return taken;
    }
    const prev = idsRef.current;
    if (prev.length === values.length) return prev;
    const next = prev.slice(0, values.length);
    while (next.length < values.length) next.push(nextId());
    idsRef.current = next;
    return next;
    // Reconcile whenever the array length changes; mutators set pendingIdsRef so
    // an identical length from a mutator still picks up the explicit ids above.
  }, [values]);

  const fields = values.map((v, i) => ({ ...(v as object), id: ids[i]! })) as Array<
    T & FieldArrayItem
  >;

  const write = (next: T[], nextIds: string[]) => {
    pendingIdsRef.current = nextIds;
    api.setValue(name, next);
  };

  return {
    fields,
    append(value) {
      write([...values, value], [...ids, nextId()]);
    },
    prepend(value) {
      write([value, ...values], [nextId(), ...ids]);
    },
    insert(index, value) {
      // Insertion is valid anywhere in [0, length]; an out-of-range index would
      // desync the value/id arrays, so no-op instead.
      if (index < 0 || index > values.length) return;
      const next = values.slice();
      next.splice(index, 0, value);
      const nextIds = ids.slice();
      nextIds.splice(index, 0, nextId());
      write(next, nextIds);
    },
    remove(index) {
      if (index < 0 || index >= values.length) return;
      const next = values.slice();
      next.splice(index, 1);
      const nextIds = ids.slice();
      nextIds.splice(index, 1);
      write(next, nextIds);
    },
    move(from, to) {
      // Guard both endpoints: an out-of-range `from` makes splice return [], so
      // `item`/`movedId` would be undefined and silently inject a hole plus a
      // bogus id, desyncing the value and id arrays.
      if (from < 0 || from >= values.length || to < 0 || to >= values.length) {
        return;
      }
      const next = values.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item as T);
      const nextIds = ids.slice();
      const [movedId] = nextIds.splice(from, 1);
      nextIds.splice(to, 0, movedId!);
      write(next, nextIds);
    },
    replace(nextValues) {
      write(
        nextValues,
        nextValues.map(() => nextId()),
      );
    },
  };
}
