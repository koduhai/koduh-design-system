import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { addToast, dismissToast, updateToast } from './store';
import type { ToastOptions } from './store';

type ShortcutOptions = Omit<ToastOptions, 'severity' | 'description'>;
type ToastFn = ((options: ToastOptions) => string) & {
  success: (description: ReactNode, options?: ShortcutOptions) => string;
  error: (description: ReactNode, options?: ShortcutOptions) => string;
  warning: (description: ReactNode, options?: ShortcutOptions) => string;
  info: (description: ReactNode, options?: ShortcutOptions) => string;
  /**
   * Drive one toast through a promise's lifecycle: shows `loading` immediately,
   * then swaps to `success`/`error` when the promise settles. Returns the same
   * promise so callers can keep chaining/awaiting.
   */
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: ReactNode;
      success: ReactNode | ((v: T) => ReactNode);
      error: ReactNode | ((e: unknown) => ReactNode);
    },
    options?: Omit<ToastOptions, 'severity' | 'description'>,
  ) => Promise<T>;
};

export interface UseToastReturn {
  toast: ToastFn;
  dismiss: (id: string) => void;
  update: (id: string, patch: Partial<ToastOptions>) => void;
}

/**
 * Imperative toast API. Works anywhere — it talks to a module-level store, so
 * it needs no provider — but toasts only render where a <Toaster> is mounted.
 */
export function useToast(): UseToastReturn {
  return useMemo<UseToastReturn>(() => {
    const toast = ((options: ToastOptions) => addToast(options)) as ToastFn;
    toast.success = (description, options) =>
      addToast({ ...options, severity: 'success', description });
    toast.error = (description, options) =>
      addToast({ ...options, severity: 'error', description });
    toast.warning = (description, options) =>
      addToast({ ...options, severity: 'warning', description });
    toast.info = (description, options) => addToast({ ...options, severity: 'info', description });
    toast.promise = (promise, msgs, options) => {
      const id = addToast({
        ...options,
        severity: 'info',
        description: msgs.loading,
        duration: Infinity,
      });
      promise.then(
        (value) =>
          updateToast(id, {
            severity: 'success',
            description:
              typeof msgs.success === 'function'
                ? (msgs.success as (v: unknown) => ReactNode)(value)
                : msgs.success,
            duration: undefined,
          }),
        (err) =>
          updateToast(id, {
            severity: 'error',
            description: typeof msgs.error === 'function' ? msgs.error(err) : msgs.error,
            duration: undefined,
          }),
      );
      return promise;
    };
    return { toast, dismiss: dismissToast, update: updateToast };
  }, []);
}
