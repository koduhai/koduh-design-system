import { Spinner } from '@koduhai/design-system';
import type { SpinnerSize, SpinnerTone } from '@koduhai/design-system';
import { DemoBlock, Demos, col, row } from './_kit';

const sizes: SpinnerSize[] = ['sm', 'md', 'lg'];
const tones: SpinnerTone[] = ['primary', 'neutral'];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="tones x sizes">
        <div style={col}>
          {tones.map((tone) => (
            <div key={tone} style={{ ...row, gap: 'var(--ku-space-6)' }}>
              <span style={{ width: 80 }}>{tone}</span>
              {sizes.map((size) => (
                <Spinner key={size} size={size} tone={tone} />
              ))}
            </div>
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="labeled (role=status)">
        <div style={row}>
          <Spinner label="Loading data" />
          <span>Loading data</span>
        </div>
      </DemoBlock>
    </Demos>
  );
}
