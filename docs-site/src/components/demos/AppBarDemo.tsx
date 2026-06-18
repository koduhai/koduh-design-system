import { AppBar, Button, Avatar } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="With actions">
        <div style={{ minWidth: 0 }}>
          <AppBar
            title="Koduh AI"
            actions={
              <>
                <Button variant="ghost" tone="neutral">
                  Docs
                </Button>
                <Avatar name="Ada Lovelace" size="sm" />
              </>
            }
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="No elevation">
        <div style={{ minWidth: 0 }}>
          <AppBar title="No elevation" elevation={false} actions={<Button size="sm">New</Button>} />
        </div>
      </DemoBlock>
    </Demos>
  );
}
