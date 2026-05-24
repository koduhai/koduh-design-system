import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Timeline.module.css';

export interface TimelineItem {
  /** Stable identity for the item, used as the React key. */
  id: string;
  /** The event title. */
  title: ReactNode;
  /** Optional timestamp / relative time label. */
  time?: ReactNode;
  /** Optional marker content (e.g. an icon); falls back to a dot. */
  icon?: ReactNode;
  /** Optional body content shown under the title. */
  content?: ReactNode;
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  /** The ordered set of events, newest-first by convention. */
  items: TimelineItem[];
}

export const Timeline = /* @__PURE__ */ forwardRef<HTMLOListElement, TimelineProps>(
  function Timeline({ items, className, ...props }, ref) {
    return (
      <ol ref={ref} className={cx(styles.root, className)} {...props}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.marker} aria-hidden>
              {item.icon != null ? (
                <span className={styles.icon}>{item.icon}</span>
              ) : (
                <span className={styles.dot} />
              )}
            </span>
            <div className={styles.body}>
              <div className={styles.header}>
                <span className={styles.title}>{item.title}</span>
                {item.time != null ? <span className={styles.time}>{item.time}</span> : null}
              </div>
              {item.content != null ? <div className={styles.content}>{item.content}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    );
  },
);
