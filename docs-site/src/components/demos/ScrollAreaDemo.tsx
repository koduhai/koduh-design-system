import { ScrollArea } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

const frame = {
  border: '1px solid var(--ku-color-border)',
  borderRadius: 'var(--ku-radius-md)',
  padding: 'var(--ku-space-2)',
} as const;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Vertical (default), capped height">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <ScrollArea maxHeight={140} style={frame}>
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              {lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </DemoBlock>
      <DemoBlock caption="Horizontal axis">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <ScrollArea orientation="horizontal" style={frame}>
            <div style={{ display: 'flex', gap: 'var(--ku-space-2)', width: 'max-content' }}>
              {lines.map((l) => (
                <span
                  key={l}
                  style={{
                    flex: '0 0 auto',
                    padding: 'var(--ku-space-1) var(--ku-space-3)',
                    background: 'var(--ku-color-bg-surface)',
                    border: '1px solid var(--ku-color-border)',
                    borderRadius: 'var(--ku-radius-sm)',
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DemoBlock>
    </Demos>
  );
}
