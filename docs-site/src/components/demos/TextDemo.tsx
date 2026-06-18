import { Text } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="size: 2xl → xs">
        <div style={col}>
          <Text size="2xl">2xl - the quick brown fox</Text>
          <Text size="xl">xl - the quick brown fox</Text>
          <Text size="lg">lg - the quick brown fox</Text>
          <Text size="md">md - the quick brown fox</Text>
          <Text size="sm">sm - the quick brown fox</Text>
          <Text size="xs">xs - the quick brown fox</Text>
        </div>
      </DemoBlock>
      <DemoBlock caption="weight · tone · family · numeric · transform">
        <div style={col}>
          <Text weight="bold">Bold weight</Text>
          <Text tone="secondary">Secondary tone</Text>
          <Text family="mono">mono - const x = 42;</Text>
          <Text numeric="tabular">tabular - 1,234.50 / 9,876.05</Text>
          <Text transform="uppercase">uppercase transform</Text>
        </div>
      </DemoBlock>
      <DemoBlock caption="leading · truncate · paragraph">
        <div style={col}>
          <Text leading="relaxed" as="p">
            relaxed leading - a longer paragraph of body text that wraps across multiple lines to
            show the increased line height.
          </Text>
          <div style={{ maxWidth: 220 }}>
            <Text truncate as="p">
              truncate - this single line is too long for the container and ends with an ellipsis.
            </Text>
          </div>
          <Text as="p">Rendered as a paragraph element.</Text>
        </div>
      </DemoBlock>
    </Demos>
  );
}
