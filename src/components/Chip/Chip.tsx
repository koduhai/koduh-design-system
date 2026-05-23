import { forwardRef } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Chip.module.css';

export type ChipVariant = 'solid' | 'outline';
export type ChipTone = 'primary' | 'neutral' | 'danger';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> {
  /** Text shown in the chip; kept a string so it can seed the delete button's label. */
  label: string;
  /** Visual style. Defaults to 'solid'. */
  variant?: ChipVariant;
  /** Semantic color. Defaults to 'neutral'. */
  tone?: ChipTone;
  /** Defaults to 'md'. */
  size?: ChipSize;
  /** Leading icon (decorative). */
  icon?: ReactNode;
  /** Makes the chip a clickable button. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Adds a labelled delete affordance. */
  onDelete?: () => void;
  /** Accessible label for the delete button. Defaults to "Remove <label>". */
  deleteLabel?: string;
}

export const Chip = /* @__PURE__ */ forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    label,
    variant = 'solid',
    tone = 'neutral',
    size = 'md',
    icon,
    onClick,
    onDelete,
    deleteLabel,
    className,
    ...props
  },
  ref,
) {
  const interactive = Boolean(onClick) && !onDelete;
  const dataAttrs = {
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
  };
  const classes = cx(styles.root, className);
  const content = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{label}</span>
      {onDelete ? (
        <button
          type="button"
          className={styles.delete}
          aria-label={deleteLabel ?? `Remove ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        onClick={onClick}
        {...dataAttrs}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={classes}
      onClick={onClick}
      {...dataAttrs}
      {...props}
    >
      {content}
    </span>
  );
});
