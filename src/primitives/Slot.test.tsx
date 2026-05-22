import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slot } from './Slot';

describe('Slot', () => {
  it('merges props onto its single child element', () => {
    render(
      <Slot data-testid="slot" className="slot-class">
        <a href="/contact" className="child-class">
          Contact
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', '/contact');
    expect(link.className).toContain('slot-class');
    expect(link.className).toContain('child-class');
  });

  it('composes event handlers from slot and child', async () => {
    const slotClick = vi.fn();
    const childClick = vi.fn();
    render(
      <Slot onClick={slotClick}>
        <button onClick={childClick}>Go</button>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(slotClick).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when child is not a valid element', () => {
    const { container } = render(<Slot>{'just text'}</Slot>);
    expect(container).toBeEmptyDOMElement();
  });
});
