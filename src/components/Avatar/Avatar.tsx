import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '../../utils/cx';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image URL. When set, an <img> is rendered. */
  src?: string;
  /** Alt text for the image. Required (for a11y) when src is set. */
  alt?: string;
  /** Used to derive initials and the aria-label when there is no image. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
  style?: CSSProperties;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, name, size = 'md', shape = 'circle', className, style },
  ref,
) {
  const dataAttrs = { 'data-size': size, 'data-shape': shape };
  const classes = cx(styles.root, className);

  return (
    <span
      ref={ref}
      className={classes}
      style={style}
      role={!src && name ? 'img' : undefined}
      aria-label={!src && name ? name : undefined}
      {...dataAttrs}
    >
      {src ? (
        <img className={styles.image} src={src} alt={alt ?? ''} />
      ) : name ? (
        <span className={styles.initials} aria-hidden>
          {initialsOf(name)}
        </span>
      ) : null}
    </span>
  );
});
