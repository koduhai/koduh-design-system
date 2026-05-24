import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const items = [
  { id: 'one', label: 'One', content: 'Panel One' },
  { id: 'two', label: 'Two', content: 'Panel Two' },
  { id: 'three', label: 'Three', content: 'Panel Three' },
];

describe('Tabs', () => {
  it('renders a tablist and selects the first tab by default', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'One' })).toHaveTextContent('Panel One');
  });

  it('activates a tab on click and links the panel', async () => {
    render(<Tabs items={items} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toHaveTextContent('Panel Two');
  });

  it('moves selection with arrow keys (roving tabindex)', async () => {
    render(<Tabs items={items} />);
    const first = screen.getByRole('tab', { name: 'One' });
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled: respects value and calls onChange', async () => {
    const onChange = vi.fn();
    render(<Tabs items={items} value="one" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true'); // controlled
  });

  it('eager (default): renders all panel content up front', () => {
    render(<Tabs items={items} />);
    // Inactive panels are hidden but their content is present in the DOM.
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    expect(screen.getByText('Panel Three')).toBeInTheDocument();
  });

  it('lazy: defers inactive panel content until first activation', async () => {
    render(<Tabs items={items} lazy />);
    // Active panel content is present; inactive ones are not yet rendered.
    expect(screen.getByText('Panel One')).toBeInTheDocument();
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
  });

  it('lazy without keepMounted: content unmounts again after re-hiding', async () => {
    render(<Tabs items={items} lazy />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument();
  });

  it('lazy + keepMounted: keeps content mounted (hidden) after re-hiding', async () => {
    render(<Tabs items={items} lazy keepMounted />);
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    // Still in the DOM, just hidden via the inactive tabpanel.
    const panelTwo = screen.getByText('Panel Two');
    expect(panelTwo).toBeInTheDocument();
    expect(panelTwo.closest('[role="tabpanel"]')).toHaveAttribute('hidden');
  });
});
