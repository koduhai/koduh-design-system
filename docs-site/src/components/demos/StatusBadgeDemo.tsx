import { StatusBadge } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="subtle">
        <div style={row}>
          <StatusBadge status="active" label="Active" />
          <StatusBadge status="inactive" label="Inactive" />
          <StatusBadge status="pending" label="Pending" />
          <StatusBadge status="error" label="Error" />
        </div>
      </DemoBlock>
      <DemoBlock caption="solid">
        <div style={row}>
          <StatusBadge status="active" label="Active" variant="solid" />
          <StatusBadge status="inactive" label="Inactive" variant="solid" />
          <StatusBadge status="pending" label="Pending" variant="solid" />
          <StatusBadge status="error" label="Error" variant="solid" />
        </div>
      </DemoBlock>
    </Demos>
  );
}
