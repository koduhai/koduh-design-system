import type { ReactNode } from 'react';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export type ToastPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastOptions {
  /**
   * Caller-supplied stable id. Re-using the same id upserts the existing toast
   * (update in place) instead of stacking a new one. Omit for an auto id.
   */
  id?: string;
  /** Drives color, icon, and ARIA politeness. Defaults to 'info'. */
  severity?: ToastSeverity;
  title?: ReactNode;
  description: ReactNode;
  /** Auto-dismiss after N ms. `Infinity`/0 disables. Defaults per severity. */
  duration?: number;
  /** Optional action element (e.g. an Undo button). */
  action?: ReactNode;
  /**
   * Pin this toast to a specific `<Toaster>` placement. When omitted, the toast
   * renders in any mounted Toaster (backward compatible).
   */
  placement?: ToastPlacement;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  severity: ToastSeverity;
}

let toasts: ToastRecord[] = [];
let counter = 0;
const listeners = new Set<() => void>();

/**
 * Per-toast auto-dismiss timers, owned by the store rather than by the rendered
 * ToastItem. Running them here means a toast queued behind the `max` cap (and
 * therefore not yet mounted) still counts down and expires on schedule, instead
 * of stalling until something ahead of it is dismissed. The default duration is
 * resolved from severity, matching the visible-toast behavior.
 */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function defaultDuration(s: ToastSeverity): number {
  return s === 'error' ? 8000 : 5000;
}

function clearTimer(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    timers.delete(id);
  }
}

function scheduleTimer(record: ToastRecord): void {
  clearTimer(record.id);
  const duration = record.duration ?? defaultDuration(record.severity);
  if (Number.isFinite(duration) && duration > 0) {
    timers.set(
      record.id,
      setTimeout(() => dismissToast(record.id), duration),
    );
  }
}

/** Pause a toast's auto-dismiss timer (e.g. on hover/focus). */
export function pauseToast(id: string): void {
  clearTimer(id);
}

/** Resume a toast's auto-dismiss timer from the full remaining duration. */
export function resumeToast(id: string): void {
  const record = toasts.find((t) => t.id === id);
  if (record) scheduleTimer(record);
}

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
  const id = options.id ?? `toast-${++counter}`;
  let record: ToastRecord;
  if (toasts.some((t) => t.id === id)) {
    toasts = toasts.map((t) =>
      t.id === id ? { ...t, ...options, id, severity: options.severity ?? t.severity } : t,
    );
    record = toasts.find((t) => t.id === id)!;
  } else {
    record = { ...options, id, severity: options.severity ?? 'info' };
    toasts = [...toasts, record];
  }
  scheduleTimer(record);
  emit();
  return id;
}

export function dismissToast(id: string): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    clearTimer(id);
    toasts = next;
    emit();
  }
}

export function updateToast(id: string, patch: Partial<ToastOptions>): void {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
  const record = toasts.find((t) => t.id === id);
  if (record) scheduleTimer(record);
  emit();
}

/** Test-only: clear all toasts and reset the id counter. */
export function __resetToasts(): void {
  for (const id of [...timers.keys()]) clearTimer(id);
  toasts = [];
  counter = 0;
  emit();
}
