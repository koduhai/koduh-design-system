import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button';

describe('ButtonGroup', () => {
  it('renders a group role and its buttons', () => {
    render(
      <ButtonGroup aria-label="Text style">
        <Button>Bold</Button>
        <Button>Italic</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Text style' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });
  it('reflects vertical orientation', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="g">
        <Button>A</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical');
  });
  it('forwards className and ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ButtonGroup ref={ref} className="x" aria-label="g">
        <Button>A</Button>
      </ButtonGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(screen.getByRole('group')).toHaveClass('x');
  });
});
