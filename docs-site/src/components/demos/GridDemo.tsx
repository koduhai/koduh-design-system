import { Grid } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const box = {
  background: 'var(--ku-brand-500)',
  color: '#fff',
  padding: 'var(--ku-space-3)',
  borderRadius: 'var(--ku-radius-md)',
  textAlign: 'center',
} as const;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Fixed three-column grid, gap=4">
        <Grid columns={3} gap={4}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={box}>
              Cell {i + 1}
            </div>
          ))}
        </Grid>
      </DemoBlock>
      <DemoBlock caption="Auto-fit tracks with minItemWidth=200px">
        <Grid minItemWidth="200px" gap={4}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={box}>
              Item {i + 1}
            </div>
          ))}
        </Grid>
      </DemoBlock>
      <DemoBlock caption="2:1 track ratio (sidebar layout)">
        <Grid columns={[2, 1]} gap={4}>
          <div style={box}>Main (2fr)</div>
          <div style={box}>Aside (1fr)</div>
        </Grid>
      </DemoBlock>
    </Demos>
  );
}
