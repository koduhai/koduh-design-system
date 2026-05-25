import { useRef, useSyncExternalStore } from 'react';
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

export function useFieldArray<T = Record<string, unknown>>(
  name: string,
): UseFieldArrayResult<T> {
  const api = useFormContext();
  const idsRef = useRef<string[]>([]);

  const values = useSyncExternalStore(
    api.subscribe,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
    () => (get(api.getValues(), name) as T[] | undefined) ?? EMPTY,
  );

  while (idsRef.current.length < values.length) idsRef.current.push(nextId());
  if (idsRef.current.length > values.length) {
    idsRef.current = idsRef.current.slice(0, values.length);
  }

  const fields = values.map((v, i) => ({ ...(v as object), id: idsRef.current[i]! })) as Array<
    T & FieldArrayItem
  >;

  const write = (next: T[], nextIds: string[]) => {
    idsRef.current = nextIds;
    api.setValue(name, next);
  };

  return {
    fields,
    append(value) {
      write([...values, value], [...idsRef.current, nextId()]);
    },
    prepend(value) {
      write([value, ...values], [nextId(), ...idsRef.current]);
    },
    insert(index, value) {
      const next = values.slice();
      next.splice(index, 0, value);
      const ids = idsRef.current.slice();
      ids.splice(index, 0, nextId());
      write(next, ids);
    },
    remove(index) {
      const next = values.slice();
      next.splice(index, 1);
      const ids = idsRef.current.slice();
      ids.splice(index, 1);
      write(next, ids);
    },
    move(from, to) {
      const next = values.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item as T);
      const ids = idsRef.current.slice();
      const [movedId] = ids.splice(from, 1);
      ids.splice(to, 0, movedId!);
      write(next, ids);
    },
    replace(nextValues) {
      write(nextValues, nextValues.map(() => nextId()));
    },
  };
}
