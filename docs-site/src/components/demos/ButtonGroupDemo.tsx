import { ButtonGroup, Button } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="horizontal (outline)">
        <ButtonGroup aria-label="Text alignment">
          <Button variant="outline" tone="neutral">
            Left
          </Button>
          <Button variant="outline" tone="neutral">
            Center
          </Button>
          <Button variant="outline" tone="neutral">
            Right
          </Button>
        </ButtonGroup>
      </DemoBlock>
      <DemoBlock caption="solid">
        <ButtonGroup aria-label="View">
          <Button tone="primary">Day</Button>
          <Button tone="primary">Week</Button>
          <Button tone="primary">Month</Button>
        </ButtonGroup>
      </DemoBlock>
      <DemoBlock caption="vertical">
        <ButtonGroup orientation="vertical" aria-label="Actions">
          <Button variant="outline" tone="neutral">
            First
          </Button>
          <Button variant="outline" tone="neutral">
            Second
          </Button>
          <Button variant="outline" tone="neutral">
            Third
          </Button>
        </ButtonGroup>
      </DemoBlock>
    </Demos>
  );
}
