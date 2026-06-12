import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { ButtonGroup } from '../ButtonGroup';
import { Button } from '../Button';
import type { ButtonTone, ButtonVariant, ButtonSize } from '../Button';
import { Menu } from '../Menu';
import type { MenuEntry } from '../Menu';
import type { PopoverPlacement } from '../Popover';
import { ChevronDownIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './SplitButton.module.css';

export interface SplitButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Primary action label. */
  children: ReactNode;
  /** Primary action handler. */
  onClick?: () => void;
  /** Secondary actions for the caret menu. */
  items: MenuEntry[];
  /** Shared tone for both buttons. Defaults to 'primary'. */
  tone?: ButtonTone;
  /** Shared variant for both buttons. Defaults to 'solid'. */
  variant?: ButtonVariant;
  /** Shared size for both buttons. Defaults to 'md'. */
  size?: ButtonSize;
  /** Disables both the primary action and the caret. */
  disabled?: boolean;
  /** Leading icon on the primary button. */
  startIcon?: ReactNode;
  /** Anchored placement of the menu panel. Defaults to 'bottom-end'. */
  menuPlacement?: PopoverPlacement;
  /** Accessible label for the caret button. Defaults to 'More actions'. */
  menuLabel?: string;
  className?: string;
}

/**
 * A primary action joined to a caret that opens a Menu of secondary actions.
 * Renders as a ButtonGroup so the two buttons read as a single cluster.
 */
export const SplitButton = /* @__PURE__ */ forwardRef<HTMLDivElement, SplitButtonProps>(
  function SplitButton(
    {
      children,
      onClick,
      items,
      tone = 'primary',
      variant = 'solid',
      size = 'md',
      disabled = false,
      startIcon,
      menuPlacement = 'bottom-end',
      menuLabel = 'More actions',
      className,
      ...props
    },
    ref,
  ) {
    return (
      <ButtonGroup ref={ref} className={cx(styles.root, className)} {...props}>
        <Button
          tone={tone}
          variant={variant}
          size={size}
          disabled={disabled}
          startIcon={startIcon}
          onClick={onClick}
        >
          {children}
        </Button>
        <Menu
          items={items}
          placement={menuPlacement}
          trigger={
            <Button
              tone={tone}
              variant={variant}
              size={size}
              disabled={disabled}
              aria-label={menuLabel}
              className={styles.caret}
            >
              <ChevronDownIcon aria-hidden />
            </Button>
          }
        />
      </ButtonGroup>
    );
  },
);
