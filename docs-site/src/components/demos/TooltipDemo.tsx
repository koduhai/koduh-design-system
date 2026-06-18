import { Tooltip, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

function Basic() {
  return (
    <div style={row}>
      <Tooltip content="Save your changes (Cmd+S)">
        <Button>Save</Button>
      </Tooltip>
      <Tooltip content="Placed on the right" placement="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      <Tooltip content="Placed at the bottom" placement="bottom">
        <Button variant="ghost">Bottom</Button>
      </Tooltip>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Hover or focus a trigger to reveal its tooltip">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
