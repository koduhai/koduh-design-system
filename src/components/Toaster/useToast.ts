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
    return { toast, dismiss: dismissToast, update: updateToast };
  }, []);
}
