import { PageHeader, Button } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Title and subtitle">
        <div style={{ minWidth: 0, width: '100%' }}>
          <PageHeader title="Dashboard" subtitle="Welcome back, Ada." />
        </div>
      </DemoBlock>
      <DemoBlock caption="With breadcrumbs and actions">
        <div style={{ minWidth: 0, width: '100%' }}>
          <PageHeader
            breadcrumbs={[
              { label: 'Home', href: '#a' },
              { label: 'Projects', href: '#b' },
              { label: 'Project Atlas' },
            ]}
            title="Project Atlas"
            subtitle="Last updated 2 hours ago"
            actions={
              <>
                <Button variant="outline" tone="neutral">
                  Settings
                </Button>
                <Button>New item</Button>
              </>
            }
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
