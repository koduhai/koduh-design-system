import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Code, CodeBlock } from './Code';

describe('Code', () => {
  it('renders an inline <code> element with its children', () => {
    render(<Code>npm install</Code>);
    const el = screen.getByText('npm install');
    expect(el.tagName).toBe('CODE');
  });

  it('forwards className and DOM props to the root', () => {
    render(
      <Code className="extra" data-testid="c">
        x
      </Code>,
    );
    const el = screen.getByTestId('c');
    expect(el).toHaveClass('extra');
  });

  it('forwards a ref to the underlying <code>', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Code ref={ref}>x</Code>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current!.tagName).toBe('CODE');
  });
});

describe('CodeBlock', () => {
  it('renders a <pre><code> with the source', () => {
    render(<CodeBlock>{`const a = 1;`}</CodeBlock>);
    const code = screen.getByText('const a = 1;');
    expect(code.tagName).toBe('CODE');
    expect(code.closest('pre')).not.toBeNull();
  });

  it('shows the language label when provided', () => {
    render(<CodeBlock language="ts">{`const a = 1;`}</CodeBlock>);
    expect(screen.getByText('ts')).toBeInTheDocument();
  });

  it('omits the language label when not provided', () => {
    const { container } = render(<CodeBlock>{`const a = 1;`}</CodeBlock>);
    const pre = container.querySelector('pre')!;
    expect(pre).not.toHaveAttribute('data-has-language');
  });

  it('forwards a ref to the underlying <pre>', () => {
    const ref = { current: null as HTMLPreElement | null };
    render(<CodeBlock ref={ref}>{`x`}</CodeBlock>);
    expect(ref.current).toBeInstanceOf(HTMLPreElement);
    expect(ref.current!.tagName).toBe('PRE');
  });
});
