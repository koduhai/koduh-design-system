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
  it('forwards id, data-*, className, and ref to the root cluster', () => {
    const ref = vi.fn();
    render(
      <SplitButton
        ref={ref}
        id="split-1"
        data-testid="cluster"
        className="custom"
        onClick={() => {}}
        items={[]}
      >
        Save
      </SplitButton>,
    );
    const root = screen.getByTestId('cluster');
    expect(root).toHaveAttribute('id', 'split-1');
    expect(root).toHaveClass('custom');
    expect(ref).toHaveBeenCalledWith(root);
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
