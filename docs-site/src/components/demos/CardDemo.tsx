import { Button, Card, CardBody, CardFooter, CardHeader } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="variants + padding">
        <div style={row}>
          <Card variant="outline" style={{ width: 180 }}>
            Outline
          </Card>
          <Card variant="elevated" style={{ width: 180 }}>
            Elevated
          </Card>
          <Card variant="flat" style={{ width: 180 }}>
            Flat
          </Card>
          <Card variant="outline" padding="lg" style={{ width: 180 }}>
            Large padding
          </Card>
        </div>
      </DemoBlock>
      <DemoBlock caption="header / body / footer slots">
        <Card variant="elevated" padding="none" style={{ maxWidth: 360, width: '100%' }}>
          <CardHeader>
            <strong>Card title</strong>
          </CardHeader>
          <CardBody>
            Body content sits in the padded region between the header and footer dividers.
          </CardBody>
          <CardFooter
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ku-space-2)' }}
          >
            <Button variant="ghost" tone="neutral" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>
      </DemoBlock>
    </Demos>
  );
}
