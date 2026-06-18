import { Container } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const box = {
  background: 'var(--ku-brand-500)',
  color: '#fff',
  padding: 'var(--ku-space-3)',
  borderRadius: 'var(--ku-radius-md)',
} as const;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Default container (size lg, padded), a centered max-width wrapper">
        <Container>
          <div style={box}>Default container: centered max-width wrapper.</div>
        </Container>
      </DemoBlock>
      <DemoBlock caption='size="sm": narrower max-width, still centered'>
        <Container size="sm">
          <div style={box}>size=&quot;sm&quot;: narrower max-width.</div>
        </Container>
      </DemoBlock>
    </Demos>
  );
}
