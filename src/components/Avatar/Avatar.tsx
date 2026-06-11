import { forwardRef, useEffect, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Image URL. When set, an <img> is rendered. */
  src?: string;
  /** Alt text for the image. Falls back to `name` when omitted (for a11y when src is set). */
  alt?: string;
  /** Used to derive initials and the aria-label when there is no image, and as the image alt fallback. */
  name?: string;
  /** Defaults to 'md'. */
  size?: AvatarSize;
  /** Defaults to 'circle'. */
  shape?: AvatarShape;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar = /* @__PURE__ */ forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, name, size = 'md', shape = 'circle', className, ...props },
  ref,
) {
  const [errored, setErrored] = useState(false);
  // Reset the error flag whenever the source changes so a new src is retried.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const showImage = !!src && !errored;
  const dataAttrs = { 'data-size': size, 'data-shape': shape };
  const classes = cx(styles.root, className);

  return (
    <span
      ref={ref}
      className={classes}
      role={!showImage && name ? 'img' : undefined}
      aria-label={!showImage && name ? name : undefined}
      {...dataAttrs}
      {...props}
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          // Fall back to name so a src+name avatar is still announced when no
          // explicit alt is given; empty string only as a last resort.
          alt={alt ?? name ?? ''}
          onError={() => setErrored(true)}
        />
      ) : name ? (
        <span className={styles.initials} aria-hidden>
          {initialsOf(name)}
        </span>
      ) : null}
    </span>
  );
});
