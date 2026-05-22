import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders an image with alt and src when src is provided', () => {
    render(<Avatar src="/me.png" alt="My photo" />);
    const img = screen.getByRole('img', { name: 'My photo' });
    expect(img).toHaveAttribute('src', '/me.png');
  });

  it('renders up to two uppercase initials from name when no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('labels the initials avatar with the name', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument();
  });

  it('reflects size and shape as data attributes', () => {
    const { container } = render(<Avatar name="Ada" size="lg" shape="square" />);
    const root = container.querySelector('[data-size]')!;
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-shape', 'square');
  });
});
