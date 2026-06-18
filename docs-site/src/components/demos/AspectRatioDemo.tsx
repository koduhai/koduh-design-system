import { AspectRatio } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const fill = (label: string) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ku-brand-500)',
      color: '#fff',
      borderRadius: 'var(--ku-radius-md)',
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Common ratios constraining a filled box">
        <div style={{ display: 'flex', gap: 'var(--ku-space-4)', alignItems: 'flex-start' }}>
          <div style={{ width: 180 }}>
            <AspectRatio ratio={16 / 9}>{fill('16 / 9')}</AspectRatio>
          </div>
          <div style={{ width: 180 }}>
            <AspectRatio ratio={4 / 3}>{fill('4 / 3')}</AspectRatio>
          </div>
          <div style={{ width: 180 }}>
            <AspectRatio ratio={1}>{fill('1 / 1')}</AspectRatio>
          </div>
        </div>
      </DemoBlock>
    </Demos>
  );
}
