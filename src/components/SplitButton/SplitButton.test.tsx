import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  it('fires the primary onClick', async () => {
    const onClick = vi.fn();
    render(
      <SplitButton onClick={onClick} items={[{ label: 'B', onSelect: () => {} }]}>
        Save
      </SplitButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('opens the menu from the caret and selects an item', async () => {
    const onSelect = vi.fn();
    render(
      <SplitButton onClick={() => {}} items={[{ label: 'Save as…', onSelect }]}>
        Save
      </SplitButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Save as…' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
  it('disables both buttons when disabled', () => {
    render(
      <SplitButton disabled onClick={() => {}} items={[]}>
        Save
      </SplitButton>,
    );
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});
