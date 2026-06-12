import { describe, it, expect, vi, afterEach } from 'vitest';
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

  it('keeps a focusable entry point when the selected tab is disabled', () => {
    const disabledSelectedItems = [
      { id: 'one', label: 'One', content: 'Panel One', disabled: true },
      { id: 'two', label: 'Two', content: 'Panel Two' },
      { id: 'three', label: 'Three', content: 'Panel Three' },
    ];
    // Force the disabled tab to be the selected one via the controlled value.
    render(<Tabs items={disabledSelectedItems} value="one" />);
    // The disabled selected tab must not be the roving entry point...
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '-1');
    // ...the first enabled tab carries tabindex 0 so Tab can still reach the list.
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '-1');
  });

  it('controlled: respects value and calls onChange', async () => {
    const onChange = vi.fn();
    render(<Tabs items={items} value="one" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true'); // controlled
  });

  it('does not re-fire onChange when the already-selected tab is clicked', async () => {
    const onChange = vi.fn();
    render(<Tabs items={items} onChange={onChange} />);
    // "One" is selected by default; clicking it again is a no-op selection.
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    expect(onChange).not.toHaveBeenCalled();
    // A real change still fires once.
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('two');
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

  describe('RTL horizontal arrow keys', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('swaps ArrowLeft/ArrowRight when direction is rtl', async () => {
      // jsdom does not resolve `dir`/`direction` layout, so report rtl for the
      // tab elements the handler measures via getComputedStyle.
      const real = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
        const style = real(el);
        Object.defineProperty(style, 'direction', { value: 'rtl', configurable: true });
        return style;
      });

      render(<Tabs items={items} />);
      const first = screen.getByRole('tab', { name: 'One' });
      first.focus();
      // In RTL, ArrowLeft moves to the next (visually leftward) tab.
      await userEvent.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
      // ArrowRight moves to the previous tab, back to the first.
      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    });
  });
});
