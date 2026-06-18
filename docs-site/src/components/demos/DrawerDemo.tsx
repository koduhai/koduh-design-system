import { useState } from 'react';
import { Drawer, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

function Basic() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Filters"
        footer={
          <div style={row}>
            <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
              Reset
            </Button>
            <Button onClick={() => setOpen(false)}>Apply</Button>
          </div>
        }
      >
        Refine the results using the controls in this panel.
      </Drawer>
    </>
  );
}

function Sides() {
  const [side, setSide] = useState<'start' | 'end' | 'top' | 'bottom' | null>(null);
  return (
    <>
      <div style={row}>
        <Button variant="outline" onClick={() => setSide('start')}>
          Start
        </Button>
        <Button variant="outline" onClick={() => setSide('end')}>
          End
        </Button>
        <Button variant="outline" onClick={() => setSide('top')}>
          Top
        </Button>
        <Button variant="outline" onClick={() => setSide('bottom')}>
          Bottom
        </Button>
      </div>
      <Drawer
        open={side !== null}
        onOpenChange={() => setSide(null)}
        side={side ?? 'end'}
        title={`${side ?? ''} drawer`.trim()}
      >
        This drawer is pinned to the {side} edge.
      </Drawer>
    </>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Drawer with footer actions">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Edge placement">
        <Sides />
      </DemoBlock>
    </Demos>
  );
}
