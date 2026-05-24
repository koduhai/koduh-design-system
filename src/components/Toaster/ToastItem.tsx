import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import type { ToastRecord, ToastSeverity } from './store';
import styles from './Toaster.module.css';

const icons: Record<ToastSeverity, ReactNode> = {
  info: <InfoIcon size={20} />,
  success: <CheckIcon size={20} />,
  warning: <WarningIcon size={20} />,
  error: <ErrorIcon size={20} />,
};
const defaultDuration = (s: ToastSeverity) => (s === 'error' ? 8000 : 5000);

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? defaultDuration(toast.severity);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const start = useCallback(() => {
    clear();
    if (Number.isFinite(duration) && duration > 0) {
      timerRef.current = setTimeout(() => onDismiss(toast.id), duration);
    }
  }, [clear, duration, onDismiss, toast.id]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onDismiss(toast.id);
  };

  const isError = toast.severity === 'error';
  return (
    <div
      className={styles.item}
      data-severity={toast.severity}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={clear}
      onMouseLeave={start}
      onFocus={clear}
      onBlur={start}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.icon} aria-hidden>
        {icons[toast.severity]}
      </span>
      <div className={styles.content}>
        {toast.title ? <div className={styles.title}>{toast.title}</div> : null}
        <div className={styles.description}>{toast.description}</div>
      </div>
      {toast.action ? <div className={styles.action}>{toast.action}</div> : null}
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}
