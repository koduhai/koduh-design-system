import { forwardRef, useEffect } from 'react';
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
  /**
   * Auto-collapse to the icon rail at or below this viewport width (number → px,
   * or any media width like `'48rem'`), via `matchMedia`. Opt-in: omit to keep
   * the sidebar width fixed. The toggle still works to expand; resizing back
   * below the breakpoint re-collapses. In controlled mode this drives
   * `onCollapsedChange` so the parent stays the source of truth.
   */
  collapseBelow?: number | string;
  /** Expanded width (number → px). Defaults to 240. */
  width?: number | string;
  /** Content above the item list (e.g. brand). */
  header?: ReactNode;
  /** Content pinned below the item list (e.g. user menu). */
  footer?: ReactNode;
}

function SidebarItemControl({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
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
    // When collapsed the label is visually hidden, so give sighted mouse users a
    // native hover tooltip for discoverability (the accessible name is unchanged).
    title: collapsed ? item.label : undefined,
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
    collapseBelow,
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

  // Opt-in responsive auto-collapse: subscribe to a max-width media query and
  // mirror its match into collapsed state. Guarded for SSR/jsdom-without-matchMedia.
  useEffect(() => {
    if (collapseBelow == null || typeof window === 'undefined' || !window.matchMedia) return;
    const bp = typeof collapseBelow === 'number' ? `${collapseBelow}px` : collapseBelow;
    const mql = window.matchMedia(`(max-width: ${bp})`);
    setCollapsed(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [collapseBelow, setCollapsed]);

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
            <SidebarItemControl item={item} collapsed={isCollapsed} />
          </li>
        ))}
      </ul>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </nav>
  );
});
