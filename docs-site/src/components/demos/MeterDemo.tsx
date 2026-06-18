import { Meter } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const pct = (v: number) => `${v}%`;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="threshold bands (good / caution / poor)">
        <div style={{ ...col, gap: 'var(--ku-space-5)', maxWidth: 360, width: '100%' }}>
          <Meter
            label="Disk (good)"
            value={20}
            low={50}
            high={80}
            optimum={10}
            formatValue={pct}
            showValue
          />
          <Meter
            label="Disk (caution)"
            value={65}
            low={50}
            high={80}
            optimum={10}
            formatValue={pct}
            showValue
          />
          <Meter
            label="Disk (poor)"
            value={92}
            low={50}
            high={80}
            optimum={10}
            formatValue={pct}
            showValue
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="neutral, higher-is-better, thin track">
        <div style={{ ...col, gap: 'var(--ku-space-5)', maxWidth: 360, width: '100%' }}>
          <Meter label="Battery (neutral)" value={64} formatValue={pct} showValue />
          <Meter
            label="Score"
            value={88}
            min={0}
            max={100}
            low={40}
            high={70}
            optimum={100}
            formatValue={pct}
            showValue
          />
          <Meter label="Thin track" value={45} size="sm" formatValue={pct} showValue />
        </div>
      </DemoBlock>
    </Demos>
  );
}
