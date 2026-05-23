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
});
