import { useState } from 'react';
import { Button } from '@koduhai/design-system';
import type { ButtonTone, ButtonVariant, ButtonSize } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const tones: ButtonTone[] = [
  'primary',
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
  'accent',
];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

function Interactive() {
  const [count, setCount] = useState(0);
  return (
    <div style={row}>
      <Button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</Button>
      <Button variant="outline" tone="neutral" onClick={() => setCount(0)}>
        Reset
      </Button>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="variant: solid · outline · ghost">
        <div style={row}>
          {variants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="tone: primary · neutral · success · warning · danger · info · accent">
        <div style={row}>
          {tones.map((t) => (
            <Button key={t} tone={t}>
              {t}
            </Button>
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="size: sm · md · lg">
        <div style={row}>
          {sizes.map((s) => (
            <Button key={s} size={s}>
              Size {s}
            </Button>
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="Interactive: onClick state">
        <Interactive />
      </DemoBlock>
    </Demos>
  );
}
