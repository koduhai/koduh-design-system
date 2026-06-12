import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './AppBar.module.css';

export type AppBarPosition = 'static' | 'sticky';

export interface AppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Brand mark shown at the start. */
  logo?: ReactNode;
  /** App or page title shown next to the logo. */
  title?: ReactNode;
  /** Right-aligned actions (buttons, avatar, menu). */
  actions?: ReactNode;
  /** Scroll behavior. Defaults to 'static'. */
  position?: AppBarPosition;
  /** Adds a bottom border + shadow. Defaults to true. */
  elevation?: boolean;
}

export const AppBar = /* @__PURE__ */ forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { logo, title, actions, position = 'static', elevation = true, className, children, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cx(styles.root, className)}
      data-position={position}
      data-elevation={elevation ? 'true' : undefined}
      {...props}
    >
      <div className={styles.start}>
        {logo ? <span className={styles.logo}>{logo}</span> : null}
        {title ? <span className={styles.title}>{title}</span> : null}
        {children}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
});
