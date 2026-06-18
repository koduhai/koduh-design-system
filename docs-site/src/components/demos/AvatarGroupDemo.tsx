import { Avatar, AvatarGroup } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="overflow, total, spacing">
        <div style={col}>
          <AvatarGroup size="sm" max={3} label="Team">
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Alan Turing" />
            <Avatar name="Linus Torvalds" />
          </AvatarGroup>
          <AvatarGroup size="md" max={4} total={42} label="Collaborators">
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Alan Turing" />
          </AvatarGroup>
          <AvatarGroup size="lg" shape="square" spacing="tight" label="Owners">
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" />
          </AvatarGroup>
        </div>
      </DemoBlock>
    </Demos>
  );
}
