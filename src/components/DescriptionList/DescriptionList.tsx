import { forwardRef, Fragment } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './DescriptionList.module.css';

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export interface DescriptionItem {
  term: ReactNode;
  description: ReactNode;
}
export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  items: DescriptionItem[];
  /** Fixed width of the term column. Defaults to 'max-content'. */
  termWidth?: string;
  /** Row gap (space token). Defaults to 3. */
  gap?: SpaceToken;
}

export const DescriptionList = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(
  function DescriptionList({ items, termWidth, gap = 3, className, style, ...props }, ref) {
    const mergedStyle = {
      ...(termWidth ? { ['--dl-term-width']: termWidth } : {}),
      ['--dl-gap']: `var(--ku-space-${gap})`,
      ...style,
    } as CSSProperties;
    return (
      <dl ref={ref} className={cx(styles.root, className)} style={mergedStyle} {...props}>
        {items.map((item, i) => (
          <Fragment key={i}>
            <dt className={styles.term}>{item.term}</dt>
            <dd className={styles.desc}>{item.description}</dd>
          </Fragment>
        ))}
      </dl>
    );
  },
);
