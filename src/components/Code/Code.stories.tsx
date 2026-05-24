import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code, CodeBlock } from './Code';

const meta = {
  title: 'Components/Code',
  component: Code,
} satisfies Meta<typeof Code>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'npm install @koduhai/design-system' } };

const sample = `import { Button } from '@koduhai/design-system';

export function App() {
  return <Button tone="primary">Save</Button>;
}`;

export const Showcase: Story = {
  args: { children: 'code' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <p style={{ margin: 0, fontFamily: 'var(--ku-font-family-base)' }}>
        Run <Code>npm run build</Code> then import <Code>Button</Code> from the package.
      </p>
      <CodeBlock language="tsx">{sample}</CodeBlock>
      <CodeBlock>{`echo "no language label"`}</CodeBlock>
    </div>
  ),
};
