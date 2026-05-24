import type { ReactNode } from 'react';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  /** Drives color, icon, and ARIA politeness. Defaults to 'info'. */
  severity?: ToastSeverity;
  title?: ReactNode;
  description: ReactNode;
  /** Auto-dismiss after N ms. `Infinity`/0 disables. Defaults per severity. */
  duration?: number;
  /** Optional action element (e.g. an Undo button). */
  action?: ReactNode;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  severity: ToastSeverity;
}

let toasts: ToastRecord[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable reference between mutations (required by useSyncExternalStore). */
export function getSnapshot(): ToastRecord[] {
  return toasts;
}

export function addToast(options: ToastOptions): string {
  const id = `toast-${++counter}`;
  toasts = [...toasts, { ...options, id, severity: options.severity ?? 'info' }];
  emit();
  return id;
}

export function dismissToast(id: string): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
}

export function updateToast(id: string, patch: Partial<ToastOptions>): void {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

/** Test-only: clear all toasts and reset the id counter. */
export function __resetToasts(): void {
  toasts = [];
  counter = 0;
  emit();
}
