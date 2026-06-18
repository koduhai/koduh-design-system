import { Skeleton } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="text lines, shapes, no animation">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ku-space-5)',
            maxWidth: 360,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-2)' }}>
            <Skeleton variant="text" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--ku-space-4)', alignItems: 'center' }}>
            <Skeleton variant="circle" width={48} height={48} />
            <Skeleton variant="rect" width={200} height={48} />
          </div>
          <Skeleton variant="rect" width={240} height={24} animation="none" />
        </div>
      </DemoBlock>
      <DemoBlock caption="composed card placeholder">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ku-space-3)',
            padding: 'var(--ku-space-4)',
            border: '1px solid var(--ku-color-border)',
            borderRadius: 'var(--ku-radius-lg)',
            maxWidth: 360,
            width: '100%',
          }}
        >
          <Skeleton variant="rect" width="100%" height={140} />
          <div style={{ display: 'flex', gap: 'var(--ku-space-3)', alignItems: 'center' }}>
            <Skeleton variant="circle" width={40} height={40} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--ku-space-2)',
              }}
            >
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        </div>
      </DemoBlock>
    </Demos>
  );
}
