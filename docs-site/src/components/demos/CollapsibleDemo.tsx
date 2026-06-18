import { Collapsible } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Closed by default">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Collapsible trigger="Shipping & delivery">
            Orders ship within 2 business days. Standard delivery takes 3 to 5 days.
          </Collapsible>
        </div>
      </DemoBlock>
      <DemoBlock caption="Open by default (defaultOpen)">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Collapsible trigger="Returns & refunds" defaultOpen>
            Return any item within 30 days for a full refund, no questions asked.
          </Collapsible>
        </div>
      </DemoBlock>
      <DemoBlock caption="Disabled trigger">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Collapsible trigger="Coming soon" disabled>
            Not available yet.
          </Collapsible>
        </div>
      </DemoBlock>
    </Demos>
  );
}
