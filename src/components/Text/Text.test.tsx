import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('renders a <span> by default with size/weight/tone data-attrs', () => {
    render(
      <Text size="lg" weight="bold" tone="secondary" data-testid="t">
        hi
      </Text>,
    );
    const el = screen.getByTestId('t');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-weight', 'bold');
    expect(el).toHaveAttribute('data-tone', 'secondary');
  });
  it('renders the tag given by `as`', () => {
    render(
      <Text as="p" data-testid="t">
        hi
      </Text>,
    );
    expect(screen.getByTestId('t').tagName).toBe('P');
  });
  it('renders the consumer element with asChild', () => {
    render(
      <Text asChild>
        <label data-testid="t">hi</label>
      </Text>,
    );
    expect(screen.getByTestId('t').tagName).toBe('LABEL');
  });
  it('defaults size to md and forwards className', () => {
    render(
      <Text className="x" data-testid="t">
        hi
      </Text>,
    );
    expect(screen.getByTestId('t')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('t')).toHaveClass('x');
  });
});
