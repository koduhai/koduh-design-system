import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('uses name as the image alt when alt is omitted', () => {
    render(<Avatar src="/me.png" name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    const { container } = render(<Avatar src="/broken.png" name="Ada Lovelace" />);
    const img = container.querySelector('img')!;
    expect(img).toBeInTheDocument();
    fireEvent.error(img);
    // The <img> element is removed and the initials fallback (labelled by name)
    // takes over, so a src+name avatar with a broken image is still announced.
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument();
  });

  it('reflects size and shape as data attributes', () => {
    const { container } = render(<Avatar name="Ada" size="lg" shape="square" />);
    const root = container.querySelector('[data-size]')!;
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-shape', 'square');
  });
});
