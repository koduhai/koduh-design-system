import { Breadcrumbs } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const trail = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Data', href: '/library/data' },
  { label: 'Current' },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Default trail">
        <Breadcrumbs aria-label="Breadcrumb" items={trail} />
      </DemoBlock>
      <DemoBlock caption="Custom separator and collapsed">
        <div style={col}>
          <Breadcrumbs
            aria-label="Breadcrumb: custom separator"
            items={trail}
            separator={<span>/</span>}
          />
          <Breadcrumbs aria-label="Breadcrumb: collapsed" items={trail} maxItems={3} />
        </div>
      </DemoBlock>
    </Demos>
  );
}
