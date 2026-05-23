import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { InfoIcon, CheckIcon, WarningIcon, ErrorIcon, CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Alert.module.css';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Semantic severity. Drives color, default icon, and ARIA role. */
  severity: AlertSeverity;
  /** Optional bold heading shown above the body. */
  title?: ReactNode;
  /** When true, shows a labeled dismiss button. */
  closable?: boolean;
  /** Called when the dismiss button is clicked. */
  onClose?: () => void;
  /**
   * Custom leading icon. Overrides the severity default.
   * Pass a falsy value (e.g. `null`) to disable the icon entirely.
   */
  icon?: ReactNode;
}

const defaultIcons: Record<AlertSeverity, ReactNode> = {
  info: <InfoIcon size={20} />,
  success: <CheckIcon size={20} />,
  warning: <WarningIcon size={20} />,
  error: <ErrorIcon size={20} />,
};

// error/warning interrupt the user (assertive); info/success are polite.
const roleForSeverity: Record<AlertSeverity, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
};

export const Alert = /* @__PURE__ */ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { severity, title, closable = false, onClose, icon, className, children, ...props },
  ref,
) {
  const resolvedIcon = icon === undefined ? defaultIcons[severity] : icon;
  const classes = cx(styles.root, className);

  return (
    <div
      ref={ref}
      role={roleForSeverity[severity]}
      className={classes}
      data-severity={severity}
      {...props}
    >
      {resolvedIcon ? (
        <span className={styles.icon} aria-hidden>
          {resolvedIcon}
        </span>
      ) : null}
      <div className={styles.content}>
        {title ? <div className={styles.title}>{title}</div> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
      {closable ? (
        <button type="button" className={styles.close} aria-label="Dismiss" onClick={onClose}>
          <CloseIcon size={18} />
        </button>
      ) : null}
    </div>
  );
});
