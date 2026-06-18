import { Sidebar } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const items = [
  { id: 'home', label: 'Home', href: '#home', active: true },
  { id: 'search', label: 'Search', href: '#search' },
  { id: 'profile', label: 'Profile', href: '#profile' },
  { id: 'disabled', label: 'Disabled', href: '#x', disabled: true },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Sidebar with header and footer">
        <div style={{ display: 'flex', height: 320 }}>
          <Sidebar
            items={items}
            aria-label="Primary"
            header={<strong>Koduh</strong>}
            footer={<small>v1.0</small>}
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="Collapsed (icon rail)">
        <div style={{ display: 'flex', height: 320 }}>
          <Sidebar
            items={items}
            aria-label="Collapsed example"
            defaultCollapsed
            header={<strong>K</strong>}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
