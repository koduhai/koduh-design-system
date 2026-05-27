import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

describe('Card', () => {
  it('renders a div with its children by default', () => {
    render(<Card>Body</Card>);
    const el = screen.getByText('Body');
    expect(el.tagName).toBe('DIV');
  });

  it('defaults to outline variant and md padding, reflected as data attributes', () => {
    const { container } = render(<Card>X</Card>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-variant', 'outline');
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

  it('exposes slot subcomponents on the compound namespace', () => {
    expect(Card.Header).toBe(CardHeader);
    expect(Card.Body).toBe(CardBody);
    expect(Card.Footer).toBe(CardFooter);
  });

  it('composes slots inside a padding="none" card', () => {
    render(
      <Card padding="none">
        <Card.Header>Title</Card.Header>
        <Card.Body>Content</Card.Body>
        <Card.Footer>Actions</Card.Footer>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});

describe.each([
  ['CardHeader', CardHeader] as const,
  ['CardBody', CardBody] as const,
  ['CardFooter', CardFooter] as const,
])('%s', (_name, Component) => {
  it('renders a div with its children by default', () => {
    render(<Component>Slot</Component>);
    const el = screen.getByText('Slot');
    expect(el.tagName).toBe('DIV');
  });

  it('forwards a consumer className alongside the scoped class', () => {
    const { container } = render(<Component className="custom">X</Component>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('custom');
    // the scoped module class is also present
    expect(root.className.split(' ').length).toBeGreaterThan(1);
  });

  it('forwards a ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Component ref={ref}>X</Component>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards arbitrary DOM props to the root', () => {
    const { container } = render(
      <Component data-testid="slot" id="s1" aria-label="region">
        X
      </Component>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('id', 's1');
    expect(root).toHaveAttribute('data-testid', 'slot');
    expect(root).toHaveAttribute('aria-label', 'region');
  });

  it('renders as the child element when asChild is set', () => {
    render(
      <Component asChild>
        <section aria-label="custom-region">Content</section>
      </Component>,
    );
    const section = screen.getByRole('region', { name: 'custom-region' });
    expect(section).toHaveTextContent('Content');
  });
});
