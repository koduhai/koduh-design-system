import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { MenuIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  /** Stable key. */
  id: string;
  /** Visible text; also the accessible name. */
  label: string;
  /** Leading icon (decorative). */
  icon?: ReactNode;
  /** When set (and not disabled), the item renders as an <a>. */
  href?: string;
  /** Marks the current page (aria-current="page" + visual indicator). */
  active?: boolean;
  /** Renders a disabled <button> and ignores href. */
  disabled?: boolean;
  /** Click handler (used for button items, or alongside an href link). */
  onClick?: () => void;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Flat list of navigation items. */
  items: SidebarItem[];
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. Defaults to false. */
  defaultCollapsed?: boolean;
  /** Called with the next collapsed value when the toggle is pressed. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Expanded width (number → px). Defaults to 240. */
  width?: number | string;
  /** Content above the item list (e.g. brand). */
  header?: ReactNode;
  /** Content pinned below the item list (e.g. user menu). */
  footer?: ReactNode;
}

function SidebarItemControl({ item }: { item: SidebarItem }) {
  const content = (
    <>
      {item.icon ? (
        <span className={styles.icon} aria-hidden>
          {item.icon}
        </span>
      ) : null}
      <span className={styles.label}>{item.label}</span>
    </>
  );
  const common = {
    className: styles.link,
    'data-active': item.active ? 'true' : undefined,
    'aria-current': item.active ? ('page' as const) : undefined,
  };

  if (item.href && !item.disabled) {
    return (
      <a href={item.href} onClick={item.onClick} {...common}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" disabled={item.disabled} onClick={item.onClick} {...common}>
      {content}
    </button>
  );
}

export const Sidebar = /* @__PURE__ */ forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    items,
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    width = 240,
    header,
    footer,
    className,
    style,
    'aria-label': ariaLabel = 'Sidebar',
    ...props
  },
  ref,
) {
  const [isCollapsed, setCollapsed] = useControllableState<boolean>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const listId = useId('sidebar-list');
  const widthValue = typeof width === 'number' ? `${width}px` : width;

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={cx(styles.root, className)}
      data-collapsed={isCollapsed ? 'true' : undefined}
      style={{ ...style, '--ku-sidebar-width': widthValue } as CSSProperties}
      {...props}
    >
      <div className={styles.top}>
        {header ? <div className={styles.header}>{header}</div> : null}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!isCollapsed}
          aria-controls={listId}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          <MenuIcon size={20} />
        </button>
      </div>
      <ul id={listId} className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <SidebarItemControl item={item} />
          </li>
        ))}
      </ul>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </nav>
  );
});
