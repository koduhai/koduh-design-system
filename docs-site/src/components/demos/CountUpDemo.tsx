import { CountUp } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Animated counters (animate on mount)">
        <div style={{ display: 'flex', gap: 'var(--ku-space-8)', fontSize: 32, fontWeight: 700 }}>
          <CountUp value={1280} />
          <CountUp value={0.984} format={(n) => `${(n * 100).toFixed(1)}%`} />
          <CountUp value={4250} format={(n) => `$${Math.round(n).toLocaleString()}`} />
        </div>
      </DemoBlock>
    </Demos>
  );
}
