import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './AspectRatio.module.css';

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width-to-height ratio (e.g. 16 / 9). Defaults to 16 / 9. */
  ratio?: number;
  /** The content to constrain. Fills the box. */
  children?: ReactNode;
}

export const AspectRatio = /* @__PURE__ */ forwardRef<HTMLDivElement, AspectRatioProps>(
  function AspectRatio({ ratio = 16 / 9, className, style, children, ...props }, ref) {
    const mergedStyle = { ['--ku-ar']: ratio, ...style } as CSSProperties;
    return (
      <div ref={ref} className={cx(styles.root, className)} style={mergedStyle} {...props}>
        {children}
      </div>
    );
  },
);
