import { Button, EmptyState } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="title, description, action">
        <div style={{ maxWidth: 420, width: '100%' }}>
          <EmptyState
            title="No results found"
            description="We couldn't find anything matching your search. Try a different term."
            action={<Button>Clear filters</Button>}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
