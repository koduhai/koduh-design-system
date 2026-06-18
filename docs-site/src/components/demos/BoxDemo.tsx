import { Box } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const surface = {
  background: 'var(--ku-brand-500)',
  color: '#fff',
  borderRadius: 'var(--ku-radius-md)',
} as const;

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Padding tokens: padding, px/py">
        <div style={row}>
          <Box padding={2} style={surface}>
            padding=2
          </Box>
          <Box padding={4} style={surface}>
            padding=4
          </Box>
          <Box px={6} py={2} style={surface}>
            px=6 py=2
          </Box>
        </div>
      </DemoBlock>
      <DemoBlock caption="grow: the middle box fills the remaining space">
        <div style={{ ...row, width: '100%' }}>
          <Box padding={3} style={surface}>
            fixed
          </Box>
          <Box grow padding={3} style={surface}>
            grow (fills remaining space)
          </Box>
          <Box padding={3} style={surface}>
            fixed
          </Box>
        </div>
      </DemoBlock>
    </Demos>
  );
}
