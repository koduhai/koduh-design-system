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

  it('seeds the first enabled item active on open and activates it with Enter', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    // On open the first enabled item (Edit) is active and announced.
    const editItem = screen.getByRole('menuitem', { name: 'Edit' });
    expect(menu).toHaveAttribute('aria-activedescendant', editItem.id);
    fireEvent.keyDown(menu, { key: 'Enter' }); // activates the seeded Edit item
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('moves active item with ArrowDown then back with ArrowUp', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // Edit -> Duplicate
    expect(menu).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Duplicate' }).id,
    );
    fireEvent.keyDown(menu, { key: 'ArrowUp' }); // back to Edit
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

  it('opens via ArrowDown on the trigger with the first item active', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Edit' }).id,
    );
  });

  it('opens via ArrowUp on the trigger with the last enabled item active', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    const menu = screen.getByRole('menu');
    // Last enabled item is "Duplicate" (Delete is disabled, separator skipped).
    expect(menu).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Duplicate' }).id,
    );
  });

  it.each([['Enter'], [' ']])('opens via %s on the trigger', (key) => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('does NOT restore focus to the trigger on outside-pointer dismiss', () => {
    render(
      <div>
        <button type="button">elsewhere</button>
        <Menu
          trigger={<button type="button">Actions</button>}
          items={[{ label: 'Edit', onSelect: () => {} }]}
        />
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
    fireEvent.click(trigger);
    elsewhere.focus();
    // Outside pointerdown closes the menu but must not yank focus back to trigger.
    fireEvent.pointerDown(elsewhere);
    expect(trigger).not.toHaveFocus();
  });

  it('omits data-density by default and reflects density="compact" on the menu list', () => {
    const items = [
      { label: 'Edit', onSelect: () => {} },
      { label: 'Delete', onSelect: () => {} },
    ];
    const { rerender } = render(
      <Menu trigger={<button type="button">Actions</button>} items={items} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).not.toHaveAttribute('data-density');
    rerender(
      <Menu trigger={<button type="button">Actions</button>} items={items} density="compact" />,
    );
    expect(screen.getByRole('menu')).toHaveAttribute('data-density', 'compact');
  });
});
