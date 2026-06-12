import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';

const ITEMS = [
  { id: 'a', title: 'Order placed', time: '09:00', content: 'Awaiting payment' },
  { id: 'b', title: 'Payment received', time: '09:05' },
  { id: 'c', title: 'Shipped', icon: '✈' },
];

describe('Timeline', () => {
  it('renders an ordered list with one item per entry', () => {
    const { container } = render(<Timeline items={ITEMS} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders titles, times and content', () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('Awaiting payment')).toBeInTheDocument();
  });

  it('omits optional time/content when not provided', () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.queryByText('Awaiting payment')).toBeInTheDocument();
    // The third item has neither time nor content.
    const items = screen.getAllByRole('listitem');
    expect(items[2]).toHaveTextContent('Shipped');
  });

  it('renders a custom icon marker when supplied', () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText('✈')).toBeInTheDocument();
  });

  it('forwards className and DOM props to the root', () => {
    const { container } = render(
      <Timeline items={ITEMS} className="extra" data-testid="tl" aria-label="History" />,
    );
    const ol = container.querySelector('ol')!;
    expect(ol).toHaveClass('extra');
    expect(ol).toHaveAttribute('data-testid', 'tl');
    expect(ol).toHaveAttribute('aria-label', 'History');
  });

  it('renders an empty list without crashing', () => {
    const { container } = render(<Timeline items={[]} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
