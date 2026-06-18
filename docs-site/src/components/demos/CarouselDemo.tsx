import { Carousel } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const slide = (label: string, bg: string) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: 120,
      borderRadius: 'var(--ku-radius-md)',
      background: bg,
      color: '#fff',
      fontSize: 'var(--ku-font-size-lg)',
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

const items = [
  { id: 'one', content: slide('Slide one', 'var(--ku-color-primary)') },
  { id: 'two', content: slide('Slide two', 'var(--ku-color-success)') },
  { id: 'three', content: slide('Slide three', 'var(--ku-color-warning)') },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Default carousel with prev/next controls and indicators">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Carousel items={items} aria-label="Default carousel" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Looping, starting on the second slide">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Carousel items={items} loop defaultIndex={1} aria-label="Looping carousel" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
