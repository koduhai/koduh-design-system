import { Inline } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const box = {
  background: 'var(--ku-brand-500)',
  color: '#fff',
  padding: 'var(--ku-space-2) var(--ku-space-3)',
  borderRadius: 'var(--ku-radius-md)',
} as const;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Horizontal flow, centered, gap=4">
        <Inline gap={4} align="center">
          <div style={box}>Alpha</div>
          <div style={box}>Bravo</div>
          <div style={box}>Charlie</div>
        </Inline>
      </DemoBlock>
      <DemoBlock caption="Wrapping in a constrained width, gap=2">
        <Inline gap={2} wrap style={{ maxWidth: 240 }}>
          <div style={box}>Wrap 1</div>
          <div style={box}>Wrap 2</div>
          <div style={box}>Wrap 3</div>
          <div style={box}>Wrap 4</div>
          <div style={box}>Wrap 5</div>
        </Inline>
      </DemoBlock>
    </Demos>
  );
}
