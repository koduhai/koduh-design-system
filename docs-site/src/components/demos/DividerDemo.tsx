import { Divider } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Horizontal separator between content">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <p style={{ margin: '0 0 var(--ku-space-3)' }}>Above the divider</p>
          <Divider />
          <p style={{ margin: 'var(--ku-space-3) 0 0' }}>Below the divider</p>
        </div>
      </DemoBlock>
      <DemoBlock caption="Vertical divider between inline items">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ku-space-3)',
            height: 24,
          }}
        >
          <span>Profile</span>
          <Divider orientation="vertical" />
          <span>Settings</span>
          <Divider orientation="vertical" />
          <span>Logout</span>
        </div>
      </DemoBlock>
      <DemoBlock caption="Labelled (decorative) divider">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Divider>OR</Divider>
        </div>
      </DemoBlock>
    </Demos>
  );
}
