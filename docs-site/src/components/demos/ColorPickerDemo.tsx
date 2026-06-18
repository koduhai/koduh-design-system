import { useState } from 'react';
import { ColorPicker } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [color, setColor] = useState('#1B5FCC');
  return (
    <div style={col}>
      <ColorPicker label="Brand color" value={color} onChange={setColor} />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>{color}</p>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Hex value with SV square, hue slider and swatches">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="With alpha channel and custom swatches">
        <div style={{ display: 'flex', gap: 'var(--ku-space-5)', flexWrap: 'wrap' }}>
          <ColorPicker label="Overlay tint" defaultValue="#7C3AED" alpha />
          <ColorPicker
            label="Theme accent"
            defaultValue="#DB2777"
            swatches={['#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#4F46E5']}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
