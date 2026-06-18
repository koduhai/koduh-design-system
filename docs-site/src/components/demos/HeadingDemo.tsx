import { Heading } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="level 1 → 6">
        <div style={col}>
          <Heading level={1}>Heading level 1</Heading>
          <Heading level={2}>Heading level 2</Heading>
          <Heading level={3}>Heading level 3</Heading>
          <Heading level={4}>Heading level 4</Heading>
          <Heading level={5}>Heading level 5</Heading>
          <Heading level={6}>Heading level 6</Heading>
        </div>
      </DemoBlock>
      <DemoBlock caption="size decoupled from level">
        <Heading level={2} size="md">
          Level 2 semantics, size md (decoupled)
        </Heading>
      </DemoBlock>
    </Demos>
  );
}
