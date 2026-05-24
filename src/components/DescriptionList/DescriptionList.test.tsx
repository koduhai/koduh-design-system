import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DescriptionList } from './DescriptionList';

const items = [
  { term: 'Status', description: 'Active' },
  { term: 'Region', description: 'us-east-1' },
];

describe('DescriptionList', () => {
  it('renders a dl with dt/dd pairs', () => {
    render(<DescriptionList items={items} />);
    const dts = screen.getAllByText(/Status|Region/);
    expect(dts.length).toBe(2);
    expect(screen.getByText('Active').tagName).toBe('DD');
    expect(screen.getByText('Status').tagName).toBe('DT');
  });
  it('sets termWidth + gap custom properties; forwards className', () => {
    render(
      <DescriptionList items={items} termWidth="120px" gap={5} className="x" data-testid="dl" />,
    );
    const el = screen.getByTestId('dl');
    expect(el).toHaveClass('x');
    expect(el.style.getPropertyValue('--dl-term-width')).toBe('120px');
    expect(el.style.getPropertyValue('--dl-gap')).toBe('var(--ku-space-5)');
  });
});
