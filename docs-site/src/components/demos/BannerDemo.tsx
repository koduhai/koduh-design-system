import { Banner, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="severities">
        <div style={{ ...col, width: '100%' }}>
          <Banner severity="info">A neutral, informational notice.</Banner>
          <Banner severity="success">Your changes were published.</Banner>
          <Banner severity="warning">Your trial ends in 3 days.</Banner>
          <Banner severity="error">We could not reach the server.</Banner>
        </div>
      </DemoBlock>
      <DemoBlock caption="title, action, dismissable">
        <div style={{ ...col, width: '100%' }}>
          <Banner
            severity="info"
            title="Maintenance scheduled"
            action={
              <Button size="sm" variant="outline" tone="primary">
                Learn more
              </Button>
            }
          >
            Service will be unavailable on Sunday from 2-4am UTC.
          </Banner>
          <Banner severity="warning" dismissable onClose={() => {}}>
            This banner can be dismissed.
          </Banner>
        </div>
      </DemoBlock>
    </Demos>
  );
}
