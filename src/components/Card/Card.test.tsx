import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders a div with its children by default', () => {
    render(<Card>Body</Card>);
    const el = screen.getByText('Body');
    expect(el.tagName).toBe('DIV');
  });

  it('defaults to outlined variant and md padding, reflected as data attributes', () => {
    const { container } = render(<Card>X</Card>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-variant', 'outlined');
    expect(root).toHaveAttribute('data-padding', 'md');
  });

  it('reflects variant and padding overrides as data attributes', () => {
    const { container } = render(
      <Card variant="elevated" padding="lg">
        X
      </Card>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-variant', 'elevated');
    expect(root).toHaveAttribute('data-padding', 'lg');
  });

  it('renders as the child element when asChild is set, merging props', () => {
    render(
      <Card asChild variant="flat">
        <article aria-label="Post">Content</article>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Post' });
    expect(article).toHaveAttribute('data-variant', 'flat');
    expect(article).toHaveTextContent('Content');
  });

  it('forwards a ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>X</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards arbitrary DOM props to the root', () => {
    const { container } = render(
      <Card data-testid="card" id="c1">
        X
      </Card>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('id', 'c1');
    expect(root).toHaveAttribute('data-testid', 'card');
  });
});
