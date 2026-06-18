import { Progress } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="tones, sizes, values">
        <div style={{ ...col, gap: 'var(--ku-space-5)', maxWidth: 360, width: '100%' }}>
          <Progress value={25} label="Primary" showValue />
          <Progress value={50} tone="success" label="Success" showValue />
          <Progress value={75} tone="warning" label="Warning" size="lg" showValue />
          <Progress value={90} tone="danger" label="Danger" size="sm" />
          <Progress label="Indeterminate" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
