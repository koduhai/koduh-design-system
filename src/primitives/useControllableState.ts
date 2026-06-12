import { useCallback, useState } from 'react';

interface UseControllableStateParams<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

/** Unify controlled and uncontrolled value handling behind one [state, setState] API. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const current = (isControlled ? value : uncontrolled) as T;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
