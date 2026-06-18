import { Avatar } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const sampleSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%235B9DFF'/%3E%3C/svg%3E";

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="sizes">
        <div style={row}>
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Grace Hopper" size="md" />
          <Avatar name="Alan Turing" size="lg" />
        </div>
      </DemoBlock>
      <DemoBlock caption="shape + image">
        <div style={row}>
          <Avatar name="Ada Lovelace" shape="square" />
          <Avatar src={sampleSrc} alt="Sample" size="lg" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
