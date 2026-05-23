import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Menu } from './Menu';

function setup(onSelect = vi.fn()) {
  render(
    <Menu
      trigger={<button type="button">Actions</button>}
      items={[
        { label: 'Edit', onSelect },
        { label: 'Duplicate', onSelect: () => {} },
        { type: 'separator' },
        { label: 'Delete', onSelect: () => {}, disabled: true },
      ]}
    />,
  );
  return { onSelect };
}

describe('Menu', () => {
  it('renders a trigger with menu semantics', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the menu and lists enabled items as menuitems', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('invokes onSelect and closes when an item is activated', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('does not activate a disabled item', () => {
    const onDelete = vi.fn();
    render(
      <Menu
        trigger={<button type="button">Actions</button>}
        items={[{ label: 'Delete', onSelect: onDelete, disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('moves active item with ArrowDown and activates with Enter', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // first enabled item: Edit
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the trigger when closed via Escape', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });
});
