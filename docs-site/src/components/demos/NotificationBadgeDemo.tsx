import { useState } from 'react';
import { Avatar, Button, NotificationBadge } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

export default function Demo() {
  const [count, setCount] = useState(3);

  return (
    <Demos>
      <DemoBlock caption="anchored over a child">
        <div style={{ ...row, gap: 'var(--ku-space-6)' }}>
          <NotificationBadge count={3} label="3 unread notifications">
            <Button variant="outline" tone="neutral">
              Inbox
            </Button>
          </NotificationBadge>

          <NotificationBadge count={150} max={99} label="99+ unread notifications">
            <Avatar name="Ada Lovelace" />
          </NotificationBadge>

          <NotificationBadge dot tone="success" label="Online">
            <Avatar name="Grace Hopper" />
          </NotificationBadge>

          <NotificationBadge count={8} tone="primary" placement="bottom-start" label="8 items">
            <Button variant="outline" tone="neutral">
              Cart
            </Button>
          </NotificationBadge>

          {/* Standalone */}
          <NotificationBadge count={12} tone="accent" label="12 results" />
        </div>
      </DemoBlock>

      <DemoBlock caption="live count (max 99)">
        <div style={row}>
          <Button size="sm" variant="outline" onClick={() => setCount((c) => Math.max(0, c - 1))}>
            -
          </Button>
          <NotificationBadge count={count} label={`${count} notifications`}>
            <Button variant="outline" tone="neutral">
              Alerts
            </Button>
          </NotificationBadge>
          <Button size="sm" variant="outline" onClick={() => setCount((c) => c + 1)}>
            +
          </Button>
        </div>
      </DemoBlock>
    </Demos>
  );
}
