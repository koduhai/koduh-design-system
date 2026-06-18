import { Timeline } from '@koduhai/design-system';
import type { TimelineItem } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const items: TimelineItem[] = [
  {
    id: '1',
    title: 'Deployment succeeded',
    time: '2 min ago',
    content: 'v2.4.0 rolled out to production across all regions.',
  },
  {
    id: '2',
    title: 'Build passed',
    time: '8 min ago',
    content: 'All checks green: unit, types, a11y.',
  },
  {
    id: '3',
    title: 'Pull request merged',
    time: '12 min ago',
  },
  {
    id: '4',
    title: 'Review approved',
    time: '1 hr ago',
    icon: '✓',
  },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Activity history">
        <div style={{ maxWidth: 480 }}>
          <Timeline items={items} aria-label="Activity history" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
