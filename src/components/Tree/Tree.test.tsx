import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tree } from './Tree';
import type { TreeNode } from './Tree';

const nodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'button', label: 'Button.tsx' },
      { id: 'tree', label: 'Tree.tsx' },
    ],
  },
  { id: 'pkg', label: 'package.json' },
];

describe('Tree', () => {
  it('renders role=tree with treeitems and aria-expanded on parents', () => {
    render(<Tree nodes={nodes} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    const src = screen.getByRole('treeitem', { name: /src/ });
    expect(src).toHaveAttribute('aria-expanded', 'false');
    // Leaf node has no aria-expanded.
    expect(screen.getByRole('treeitem', { name: 'package.json' })).not.toHaveAttribute(
      'aria-expanded',
    );
    // Children of a collapsed parent are not rendered.
    expect(screen.queryByRole('treeitem', { name: 'Button.tsx' })).not.toBeInTheDocument();
  });

  it('declares aria-multiselectable=false on the tree (single-select model)', () => {
    render(<Tree nodes={nodes} />);
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'false');
  });

  it('keeps aria-selected on at most one node when selection moves', async () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} defaultSelectedId="button" />);
    const button = screen.getByRole('treeitem', { name: 'Button.tsx' });
    const tree = screen.getByRole('treeitem', { name: 'Tree.tsx' });
    expect(button).toHaveAttribute('aria-selected', 'true');
    expect(tree).toHaveAttribute('aria-selected', 'false');
    // Selecting another node moves selection rather than accumulating it.
    await userEvent.click(tree);
    expect(button).toHaveAttribute('aria-selected', 'false');
    expect(tree).toHaveAttribute('aria-selected', 'true');
    const selectedItems = screen
      .getAllByRole('treeitem')
      .filter((el) => el.getAttribute('aria-selected') === 'true');
    expect(selectedItems).toHaveLength(1);
  });

  it('reveals children via a nested role=group when expanded', () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: /src/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles expansion on click of a parent', async () => {
    render(<Tree nodes={nodes} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    await userEvent.click(src);
    expect(src).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(src);
    expect(src).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowRight expands a collapsed parent, then moves into the first child', async () => {
    render(<Tree nodes={nodes} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    src.focus();
    await userEvent.keyboard('{ArrowRight}'); // expand
    expect(src).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowRight}'); // into first child
    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toHaveFocus();
  });

  it('ArrowLeft collapses an expanded parent, then moves out to the parent', async () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    const child = screen.getByRole('treeitem', { name: 'Button.tsx' });
    child.focus();
    await userEvent.keyboard('{ArrowLeft}'); // move out to parent
    const src = screen.getByRole('treeitem', { name: /src/ });
    expect(src).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}'); // collapse
    expect(src).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowUp/ArrowDown move between visible rows (roving tabindex)', async () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    src.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'Tree.tsx' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toHaveFocus();
  });

  it('only one row is tabbable at a time (roving tabindex)', () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    const tabbable = screen
      .getAllByRole('treeitem')
      .filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
    // Defaults to the first visible row.
    expect(tabbable[0]).toHaveAccessibleName(/src/);
  });

  it('roving tabindex follows the last-focused row after arrow navigation', async () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    src.focus();
    await userEvent.keyboard('{ArrowDown}'); // move focus to Button.tsx
    const child = screen.getByRole('treeitem', { name: 'Button.tsx' });
    expect(child).toHaveFocus();
    // The last-focused row becomes the single tabbable entry point, not src.
    expect(child).toHaveAttribute('tabindex', '0');
    expect(src).toHaveAttribute('tabindex', '-1');
    const tabbable = screen
      .getAllByRole('treeitem')
      .filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('falls back to the first visible row when the last-focused row is collapsed away', async () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    src.focus();
    await userEvent.keyboard('{ArrowDown}'); // focus Button.tsx
    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toHaveAttribute('tabindex', '0');
    // Collapse src so the focused child unmounts.
    await userEvent.click(src);
    expect(screen.queryByRole('treeitem', { name: 'Button.tsx' })).not.toBeInTheDocument();
    // Tabbable falls back to the first visible row rather than a vanished one.
    expect(src).toHaveAttribute('tabindex', '0');
    const tabbable = screen
      .getAllByRole('treeitem')
      .filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('Enter selects a node and reflects aria-selected', async () => {
    const onSelect = vi.fn();
    render(<Tree nodes={nodes} defaultExpanded={['src']} onSelect={onSelect} />);
    const child = screen.getByRole('treeitem', { name: 'Button.tsx' });
    child.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('button');
  });

  it('uncontrolled selection: updates aria-selected on click and still fires onSelect', async () => {
    const onSelect = vi.fn();
    render(<Tree nodes={nodes} defaultExpanded={['src']} onSelect={onSelect} />);
    const child = screen.getByRole('treeitem', { name: 'Button.tsx' });
    await userEvent.click(child);
    expect(onSelect).toHaveBeenCalledWith('button');
    // Uncontrolled: the component tracks selection itself.
    expect(child).toHaveAttribute('aria-selected', 'true');
    expect(child).toHaveAttribute('tabindex', '0');
  });

  it('uncontrolled selection: seeds from defaultSelectedId', () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} defaultSelectedId="tree" />);
    const selected = screen.getByRole('treeitem', { name: 'Tree.tsx' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('tabindex', '0');
  });

  it('controlled selection: aria-selected does not move until selectedId prop changes', async () => {
    const onSelect = vi.fn();
    render(<Tree nodes={nodes} defaultExpanded={['src']} selectedId="tree" onSelect={onSelect} />);
    const button = screen.getByRole('treeitem', { name: 'Button.tsx' });
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('button');
    // Controlled: selection stays on the prop value until the parent updates it.
    expect(button).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('treeitem', { name: 'Tree.tsx' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('reflects controlled selectedId via aria-selected and makes it the tab entry point', () => {
    render(<Tree nodes={nodes} defaultExpanded={['src']} selectedId="tree" />);
    const selected = screen.getByRole('treeitem', { name: 'Tree.tsx' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('tabindex', '0');
  });

  it('controlled expansion: respects expanded and calls onExpandedChange', async () => {
    const onExpandedChange = vi.fn();
    render(<Tree nodes={nodes} expanded={[]} onExpandedChange={onExpandedChange} />);
    const src = screen.getByRole('treeitem', { name: /src/ });
    await userEvent.click(src);
    expect(onExpandedChange).toHaveBeenCalledWith(['src']);
    // Controlled: stays collapsed because parent did not update the prop.
    expect(src).toHaveAttribute('aria-expanded', 'false');
  });

  it('forwards a ref and DOM props to the root', () => {
    const ref = createRef<HTMLUListElement>();
    render(<Tree ref={ref} nodes={nodes} data-testid="t" aria-label="Files" />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
    expect(screen.getByTestId('t')).toHaveAttribute('aria-label', 'Files');
  });
});
