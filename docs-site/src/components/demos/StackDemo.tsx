import { Stack } from '@koduhai/design-system';
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
      <DemoBlock caption="Vertical stack (default), gap=4">
        <Stack gap={4} style={{ width: '100%' }}>
          <div style={box}>One</div>
          <div style={box}>Two</div>
          <div style={box}>Three</div>
        </Stack>
      </DemoBlock>
      <DemoBlock caption="Centered items, gap=4">
        <Stack gap={4} align="center" style={{ width: '100%' }}>
          <div style={box}>align=&quot;center&quot;</div>
          <div style={box}>Items centered on the cross axis</div>
        </Stack>
      </DemoBlock>
    </Demos>
  );
}
