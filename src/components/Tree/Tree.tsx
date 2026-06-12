import { forwardRef, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { ChevronRightIcon } from '../../icons';
import styles from './Tree.module.css';

export interface TreeNode {
  /** Stable identity; used for expansion + selection. */
  id: string;
  /** Content rendered inside the treeitem row. */
  label: ReactNode;
  /** Child nodes; presence makes this a parent (expandable) item. */
  children?: TreeNode[];
}

export interface TreeProps extends Omit<
  HTMLAttributes<HTMLUListElement>,
  'onSelect' | 'defaultValue'
> {
  /** The hierarchy to render. */
  nodes: TreeNode[];
  /** Initially expanded parent ids when uncontrolled. */
  defaultExpanded?: string[];
  /** Controlled set of expanded parent ids. */
  expanded?: string[];
  /** Fires with the next set of expanded ids. */
  onExpandedChange?: (ids: string[]) => void;
  /** Initially selected node id when uncontrolled. */
  defaultSelectedId?: string;
  /** Controlled selected node id. */
  selectedId?: string;
  /** Fires with a node id when it is selected. */
  onSelect?: (id: string) => void;
}

/** Hard cap on nesting we will descend, as a recursion-depth guard. */
const MAX_DEPTH = 50;

/** A visible (currently reachable) row, in DOM/visual order. */
interface VisibleRow {
  id: string;
  parentId: string | null;
  hasChildren: boolean;
  expanded: boolean;
  depth: number;
}

export const Tree = /* @__PURE__ */ forwardRef<HTMLUListElement, TreeProps>(function Tree(
  {
    nodes,
    defaultExpanded,
    expanded,
    onExpandedChange,
    defaultSelectedId,
    selectedId,
    onSelect,
    className,
    ...props
  },
  ref,
) {
  const [expandedIds, setExpandedIds] = useControllableState<string[]>({
    value: expanded,
    defaultValue: defaultExpanded ?? [],
    onChange: undefined,
  });
  const expandedSet = new Set(expandedIds);

  // Selection follows the controlled/uncontrolled symmetry: pass selectedId to
  // control it, defaultSelectedId to seed it, and onSelect fires either way.
  const [selected, setSelected] = useControllableState<string | undefined>({
    value: selectedId,
    defaultValue: defaultSelectedId,
    onChange: onSelect as ((value: string | undefined) => void) | undefined,
  });

  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // The most recently focused row id. Per the APG roving-tabindex pattern, the
  // last item the user focused should remain the single tabbable item so that
  // tabbing out and back into the tree restores their position rather than
  // resetting to the first/selected row.
  const [lastFocusedId, setLastFocusedId] = useState<string | undefined>(undefined);

  const setExpanded = (next: string[]) => {
    setExpandedIds(next);
    onExpandedChange?.(next);
  };

  const expand = (id: string) => {
    if (expandedSet.has(id)) return;
    setExpanded([...expandedIds, id]);
  };
  const collapse = (id: string) => {
    if (!expandedSet.has(id)) return;
    setExpanded(expandedIds.filter((x) => x !== id));
  };
  const toggle = (id: string) => {
    if (expandedSet.has(id)) collapse(id);
    else expand(id);
  };

  const select = (id: string) => {
    setSelected(id);
  };

  // Flatten the currently-visible rows (roots + descendants of expanded parents),
  // in visual order, so roving focus / arrow navigation can step linearly.
  const visible: VisibleRow[] = [];
  const walk = (list: TreeNode[], parentId: string | null, depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const node of list) {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = hasChildren && expandedSet.has(node.id);
      visible.push({ id: node.id, parentId, hasChildren, expanded: isExpanded, depth });
      if (hasChildren && isExpanded) {
        walk(node.children as TreeNode[], node.id, depth + 1);
      }
    }
  };
  walk(nodes, null, 0);

  const isVisible = (id: string | undefined): boolean =>
    id != null && visible.some((row) => row.id === id);

  // The roving-tabindex entry point: prefer the last-focused row, then the
  // selection, then the first visible row. Each candidate is only honored while
  // it is still visible (its parent may have collapsed), so we always fall back
  // to a row that actually exists in the current tree.
  const tabbableId = isVisible(lastFocusedId)
    ? lastFocusedId
    : isVisible(selected)
      ? selected
      : visible[0]?.id;

  const focusRow = (id: string | undefined) => {
    if (id == null) return;
    rowRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, row: VisibleRow) => {
    const index = visible.findIndex((r) => r.id === row.id);
    if (index === -1) return;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        focusRow(visible[index + 1]?.id);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        focusRow(visible[index - 1]?.id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (row.hasChildren && !row.expanded) {
          expand(row.id);
        } else if (row.hasChildren && row.expanded) {
          // Move into the first child (which is the next visible row).
          focusRow(visible[index + 1]?.id);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (row.hasChildren && row.expanded) {
          collapse(row.id);
        } else if (row.parentId != null) {
          // Move out to the parent.
          focusRow(row.parentId);
        }
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusRow(visible[0]?.id);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusRow(visible[visible.length - 1]?.id);
        break;
      }
      case 'Enter':
      case ' ':
      case 'Spacebar': {
        event.preventDefault();
        select(row.id);
        break;
      }
      default:
        break;
    }
  };

  const renderLevel = (list: TreeNode[], depth: number): ReactNode => {
    if (depth > MAX_DEPTH) return null;
    return list.map((node) => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = hasChildren && expandedSet.has(node.id);
      const isSelected = selected != null && node.id === selected;
      const isTabbable = node.id === tabbableId;
      return (
        <li key={node.id} role="none" className={styles.item}>
          <div
            ref={(el) => {
              // Delete the entry when the row unmounts (el === null) so the Map
              // does not accumulate stale null-valued keys as parents collapse.
              if (el) rowRefs.current.set(node.id, el);
              else rowRefs.current.delete(node.id);
            }}
            role="treeitem"
            tabIndex={isTabbable ? 0 : -1}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={isSelected}
            data-selected={isSelected ? 'true' : undefined}
            className={styles.row}
            style={{ '--tree-depth': depth } as CSSProperties}
            onFocus={() => {
              setLastFocusedId(node.id);
            }}
            onClick={() => {
              if (hasChildren) toggle(node.id);
              select(node.id);
            }}
            onKeyDown={(event) => {
              // Resolve the row from the flattened visible list, which carries the
              // resolved parentId for ArrowLeft "move out".
              const flat = visible.find((r) => r.id === node.id);
              if (flat) handleKeyDown(event, flat);
            }}
          >
            <span
              className={styles.twisty}
              data-has-children={hasChildren ? 'true' : undefined}
              data-expanded={isExpanded ? 'true' : undefined}
              aria-hidden
            >
              {hasChildren ? <ChevronRightIcon size={16} className={styles.chevron} /> : null}
            </span>
            <span className={styles.label}>{node.label}</span>
          </div>
          {hasChildren && isExpanded ? (
            <ul role="group" className={styles.group}>
              {renderLevel(node.children as TreeNode[], depth + 1)}
            </ul>
          ) : null}
        </li>
      );
    });
  };

  return (
    // Selection is single-node only (one `selectedId`, so at most one item carries
    // `aria-selected="true"`). Per WAI-ARIA, a `tree` that does not allow multiple
    // simultaneous selection should advertise that explicitly, so we set
    // `aria-multiselectable="false"` rather than omitting it.
    <ul
      ref={ref}
      role="tree"
      aria-multiselectable={false}
      className={cx(styles.root, className)}
      {...props}
    >
      {renderLevel(nodes, 0)}
    </ul>
  );
});
