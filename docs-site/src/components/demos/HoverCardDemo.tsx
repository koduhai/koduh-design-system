import { HoverCard, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  return (
    <HoverCard trigger={<Button variant="ghost">@koduhai</Button>}>
      <div style={{ ...col, padding: 'var(--ku-space-2)', maxWidth: 260 }}>
        <strong>Koduhai</strong>
        <span style={{ color: 'var(--ku-color-fg-muted)' }}>
          A from-scratch React component library with zero third-party UI dependencies. Hover or
          focus the trigger to reveal this card.
        </span>
      </div>
    </HoverCard>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Rich content on hover or focus">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}
