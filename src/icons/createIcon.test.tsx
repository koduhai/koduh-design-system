import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createIcon } from './createIcon';

const TestIcon = createIcon('TestIcon', <path d="M0 0h24v24H0z" />);

describe('createIcon', () => {
  it('renders an svg using currentColor and a default size of 24', () => {
    const { container } = render(<TestIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<TestIcon />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes labelled (not hidden) when given a title', () => {
    const { container, getByText } = render(<TestIcon title="Test" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(getByText('Test').tagName.toLowerCase()).toBe('title');
  });

  it('accepts a custom size', () => {
    const { container } = render(<TestIcon size={16} />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('16');
  });
});
