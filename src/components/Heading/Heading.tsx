import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import type { HeadingLevel } from '../../utils/headingLevel';
import styles from './Heading.module.css';

export type { HeadingLevel };
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type HeadingWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const defaultSizeForLevel: Record<HeadingLevel, HeadingSize> = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'md',
  5: 'sm',
  6: 'sm',
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level — renders <h1>..<h6>. */
  level: HeadingLevel;
  /** Visual size; defaults from `level`. */
  size?: HeadingSize;
  weight?: HeadingWeight;
}

export const Heading = /* @__PURE__ */ forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ level, size, weight, className, ...props }, ref) {
    return createElement(`h${level}`, {
      ref,
      className: cx(styles.root, className),
      'data-size': size ?? defaultSizeForLevel[level],
      'data-weight': weight,
      ...props,
    });
  },
);
