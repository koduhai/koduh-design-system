import { Code, CodeBlock } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const sample = `import { Button } from '@koduhai/design-system';

export function App() {
  return <Button tone="primary">Save</Button>;
}`;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Inline code">
        <p style={{ margin: 0, fontFamily: 'var(--ku-font-family-base)' }}>
          Run <Code>npm run build</Code> then import <Code>Button</Code> from the package.
        </p>
      </DemoBlock>
      <DemoBlock caption="Code blocks">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ku-space-4)',
            maxWidth: 480,
          }}
        >
          <CodeBlock language="tsx">{sample}</CodeBlock>
          <CodeBlock>{`echo "no language label"`}</CodeBlock>
        </div>
      </DemoBlock>
    </Demos>
  );
}
