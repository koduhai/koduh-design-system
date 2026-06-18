import { Card, Stat } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="trend + delta in cards">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--ku-space-4)',
            maxWidth: 720,
            width: '100%',
          }}
        >
          <Card>
            <Stat label="MRR" value="$48.2k" delta="12%" trend="up" helpText="vs. last month" />
          </Card>
          <Card>
            <Stat label="Churn" value="2.1%" delta="0.4%" trend="down" helpText="vs. last month" />
          </Card>
          <Card>
            <Stat label="Active users" value="1,204" delta="0%" trend="neutral" />
          </Card>
        </div>
      </DemoBlock>
    </Demos>
  );
}
