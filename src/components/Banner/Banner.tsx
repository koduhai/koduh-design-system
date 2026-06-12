import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import { useMessages } from '../../i18n';
import styles from './Banner.module.css';

export type BannerSeverity = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Semantic severity. Drives color, default icon, and ARIA role. */
  severity: BannerSeverity;
  /** Optional bold heading shown above the body. */
  title?: ReactNode;
  /** The notice message body. */
  children: ReactNode;
  /**
   * Custom leading icon. Overrides the severity default.
   * Pass `null` to hide the icon entirely.
   */
  icon?: ReactNode;
  /** When true, shows a labeled dismiss button. */
  dismissable?: boolean;
  /** Called when the dismiss button is pressed. */
  onClose?: () => void;
  /**
   * Accessible label for the dismiss button. Overrides the i18n catalog's
   * `dismiss` (default 'Dismiss').
   */
  closeLabel?: string;
  /** Trailing call-to-action slot (e.g. a Button or Link). */
  action?: ReactNode;
}

const defaultIcons: Record<BannerSeverity, ReactNode> = {
  info: <InfoIcon size={20} />,
  success: <CheckIcon size={20} />,
  warning: <WarningIcon size={20} />,
  error: <ErrorIcon size={20} />,
};

// error/warning interrupt the user (assertive); info/success are polite.
const roleForSeverity: Record<BannerSeverity, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
};

export const Banner = /* @__PURE__ */ forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    severity,
    title,
    icon,
    dismissable = false,
    onClose,
    closeLabel,
    action,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = useMessages();
  const resolvedIcon = icon === undefined ? defaultIcons[severity] : icon;

  return (
    <div
      ref={ref}
      role={roleForSeverity[severity]}
      className={cx(styles.root, className)}
      data-severity={severity}
      {...props}
    >
      {resolvedIcon ? (
        <span className={styles.icon} data-banner-icon aria-hidden>
          {resolvedIcon}
        </span>
      ) : null}
      <div className={styles.content}>
        {title ? <span className={styles.title}>{title}</span> : null}
        <span className={styles.body}>{children}</span>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
      {dismissable ? (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={closeLabel ?? messages.dismiss}
          onClick={onClose}
        >
          <CloseIcon size={18} />
        </button>
      ) : null}
    </div>
  );
});
