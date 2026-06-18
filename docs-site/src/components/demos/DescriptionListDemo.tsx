import { DescriptionList } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const items = [
  { term: 'Status', description: 'Active' },
  { term: 'Region', description: 'us-east-1' },
  { term: 'Plan', description: 'Enterprise' },
  { term: 'Owner', description: 'koduhai@koduhai.com' },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Default term width">
        <DescriptionList items={items} />
      </DemoBlock>
      <DemoBlock caption="Fixed term column (140px)">
        <DescriptionList items={items} termWidth="140px" />
      </DemoBlock>
    </Demos>
  );
}
