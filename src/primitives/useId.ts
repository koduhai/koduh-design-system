import { useId as useReactId } from 'react';

/** SSR-safe unique id with a stable, colon-free prefix (safe for CSS selectors). */
export function useId(prefix = 'ku'): string {
  const reactId = useReactId();
  return `${prefix}-${reactId.replace(/:/g, '')}`;
}
