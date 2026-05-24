import { forwardRef, Children, cloneElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import type { AvatarProps, AvatarSize, AvatarShape } from '../Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Cap the number of visible avatars; the remainder collapses into a +N chip. */
  max?: number;
  /** Logical total when more avatars exist than are rendered (server-truncated lists). */
  total?: number;
  /** Propagated to every child Avatar and the overflow chip. Defaults to 'md'. */
  size?: AvatarSize;
  /** Propagated to every child Avatar and the overflow chip. Defaults to 'circle'. */
  shape?: AvatarShape;
  /** Overlap amount. Defaults to 'normal'. */
  spacing?: 'tight' | 'normal';
}

export const AvatarGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      max,
      total,
      size = 'md',
      shape = 'circle',
      spacing = 'normal',
      className,
      children,
      ...props
    },
    ref,
  ) {
    const avatars = Children.toArray(children).filter(
      isValidElement,
    ) as ReactElement<AvatarProps>[];
    const count = total ?? avatars.length;
    const hasOverflow = max != null && count > max;
    // When overflowing, reserve one slot for the +N chip — but always keep at
    // least one avatar visible beside it (max=1 still shows one avatar + chip).
    const visibleCount = hasOverflow ? Math.max(1, max - 1) : avatars.length;
    const visible = avatars.slice(0, Math.max(0, visibleCount));
    const overflow = count - visible.length;

    return (
      <div ref={ref} className={cx(styles.root, className)} data-spacing={spacing} {...props}>
        {visible.map((child, index) =>
          cloneElement(child, {
            key: child.key ?? index,
            size,
            shape,
            className: cx(styles.avatar, child.props.className),
          }),
        )}
        {hasOverflow && overflow > 0 ? (
          <span
            className={cx(styles.avatar, styles.overflow)}
            data-size={size}
            data-shape={shape}
            aria-label={`${overflow} more`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
    );
  },
);
