import { Kbd } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Key chips">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-4)' }}>
          <div style={row}>
            <Kbd size="sm">Esc</Kbd>
            <Kbd size="sm">⌘</Kbd>
            <Kbd size="sm">K</Kbd>
          </div>
          <div style={row}>
            <Kbd>Ctrl</Kbd>
            <span aria-hidden>+</span>
            <Kbd>Shift</Kbd>
            <span aria-hidden>+</span>
            <Kbd>P</Kbd>
          </div>
          <p style={{ margin: 0 }}>
            Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">K</Kbd> to open the command palette.
          </p>
        </div>
      </DemoBlock>
    </Demos>
  );
}
