import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { subscribe, getSnapshot, dismissToast } from './store';
import { ToastItem } from './ToastItem';
import styles from './Toaster.module.css';

export type ToasterPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToasterProps {
  /** Where the stack anchors. Defaults to 'bottom-right'. */
  placement?: ToasterPlacement;
  /** Max simultaneously visible; overflow waits FIFO. Defaults to 3. */
  max?: number;
  /** Space between stacked toasts (--ku-space scale). Defaults to 3. */
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
}

export function Toaster({ placement = 'bottom-right', max = 3, gap = 3 }: ToasterProps) {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (toasts.length === 0) return null;
  // Top placements show newest at top; bottom placements show newest at bottom.
  const visible = toasts.slice(0, max);
  const ordered = placement.startsWith('top') ? [...visible].reverse() : visible;
  return (
    <div
      className={styles.region}
      data-placement={placement}
      role="region"
      aria-label="Notifications"
      style={{ ['--toaster-gap']: `var(--ku-space-${gap})` } as CSSProperties}
    >
      {ordered.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
