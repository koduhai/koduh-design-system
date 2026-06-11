import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: 'Section A', content: 'Body A' },
  { id: 'b', title: 'Section B', content: 'Body B' },
];

describe('Accordion', () => {
  it('renders headers as buttons with aria-expanded', () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    expect(a).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a panel on click and links it via aria-controls/labelledby', async () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    await userEvent.click(a);
    expect(a).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Section A' });
    expect(region).toHaveTextContent('Body A');
  });

  it('single mode collapses the previously open item', async () => {
    render(<Accordion items={items} defaultValue="a" />);
    await userEvent.click(screen.getByRole('button', { name: 'Section B' }));
    expect(screen.getByRole('button', { name: 'Section A' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Section B' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('multiple mode keeps several open and reports an array to onChange', async () => {
    const onChange = vi.fn();
    render(<Accordion items={items} multiple onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Section B' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  });

  it('eager (default): renders all panel content up front', () => {
    render(<Accordion items={items} />);
    // Collapsed panels are hidden but their content is present in the DOM.
    expect(screen.getByText('Body A')).toBeInTheDocument();
    expect(screen.getByText('Body B')).toBeInTheDocument();
  });

  it('lazy: defers collapsed panel content until first expansion', async () => {
    render(<Accordion items={items} lazy />);
    expect(screen.queryByText('Body A')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    expect(screen.getByText('Body A')).toBeInTheDocument();
  });

  it('lazy without keepMounted: content unmounts again after collapse', async () => {
    render(<Accordion items={items} lazy defaultValue="a" />);
    expect(screen.getByText('Body A')).toBeInTheDocument();
    // Single mode is collapsible by default — clicking the open item closes it.
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    expect(screen.queryByText('Body A')).not.toBeInTheDocument();
  });

  it('wraps each trigger in an <h3> heading by default', () => {
    const { container } = render(<Accordion items={items} />);
    const headings = container.querySelectorAll('h3');
    expect(headings).toHaveLength(items.length);
    expect(headings[0]?.querySelector('button')).toHaveTextContent('Section A');
  });

  it('renders the configured heading level', () => {
    const { container } = render(<Accordion items={items} headingLevel={2} />);
    expect(container.querySelectorAll('h2')).toHaveLength(items.length);
    expect(container.querySelectorAll('h3')).toHaveLength(0);
  });

  it('ArrowDown/ArrowUp move focus between headers and wrap', async () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    const b = screen.getByRole('button', { name: 'Section B' });
    a.focus();
    expect(a).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(b).toHaveFocus();
    // Wraps back to the first header from the last.
    await userEvent.keyboard('{ArrowDown}');
    expect(a).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(b).toHaveFocus();
  });

  it('Home/End jump to the first/last header', async () => {
    render(<Accordion items={items} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    const b = screen.getByRole('button', { name: 'Section B' });
    a.focus();
    await userEvent.keyboard('{End}');
    expect(b).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(a).toHaveFocus();
  });

  it('arrow navigation skips disabled headers', async () => {
    const withDisabled = [
      { id: 'a', title: 'Section A', content: 'Body A' },
      { id: 'b', title: 'Section B', content: 'Body B', disabled: true },
      { id: 'c', title: 'Section C', content: 'Body C' },
    ];
    render(<Accordion items={withDisabled} />);
    const a = screen.getByRole('button', { name: 'Section A' });
    const c = screen.getByRole('button', { name: 'Section C' });
    a.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(c).toHaveFocus();
  });

  it('lazy + keepMounted: keeps content mounted (hidden) after collapse', async () => {
    render(<Accordion items={items} lazy keepMounted />);
    expect(screen.queryByText('Body A')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    expect(screen.getByText('Body A')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Section A' }));
    // Still in the DOM, just hidden via the collapsed region.
    const bodyA = screen.getByText('Body A');
    expect(bodyA).toBeInTheDocument();
    expect(bodyA.closest('[role="region"]')).toHaveAttribute('hidden');
  });
});
