import { Accordion } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const items = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    content: 'Orders ship within 2 business days. Standard delivery takes 3 to 5 days.',
  },
  {
    id: 'returns',
    title: 'Returns & refunds',
    content: 'Return any item within 30 days for a full refund, no questions asked.',
  },
  {
    id: 'warranty',
    title: 'Warranty',
    content: 'All products carry a 2-year limited manufacturer warranty.',
  },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Single (collapsible): only one panel open at a time">
        <div style={{ width: '100%', maxWidth: 520 }}>
          <Accordion items={items} defaultValue="shipping" collapsible />
        </div>
      </DemoBlock>
      <DemoBlock caption="Multiple: several panels open at once">
        <div style={{ width: '100%', maxWidth: 520 }}>
          <Accordion items={items} multiple defaultValue={['returns', 'warranty']} />
        </div>
      </DemoBlock>
      <DemoBlock caption="With a disabled item">
        <div style={{ width: '100%', maxWidth: 520 }}>
          <Accordion
            items={[
              items[0]!,
              {
                id: 'soon',
                title: 'Coming soon (disabled)',
                content: 'Not available yet.',
                disabled: true,
              },
              items[2]!,
            ]}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
