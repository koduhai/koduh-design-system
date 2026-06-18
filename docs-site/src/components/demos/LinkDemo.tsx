import { Link } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Links in running text (persistent underline)">
        <p style={{ maxWidth: 480, color: 'var(--ku-color-text-primary)' }}>
          Read the{' '}
          <Link href="#" tone="primary">
            getting started guide
          </Link>{' '}
          and our{' '}
          <Link href="#" tone="neutral">
            terms of service
          </Link>{' '}
          before you begin.
        </p>
      </DemoBlock>
      <DemoBlock caption="Standalone links (underline variants)">
        <nav aria-label="Example navigation" style={{ display: 'flex', gap: 20 }}>
          <Link href="#" underline="hover">
            Dashboard
          </Link>
          <Link href="#" underline="hover" tone="neutral">
            Settings
          </Link>
          <Link href="#" underline="none">
            Help
          </Link>
        </nav>
      </DemoBlock>
    </Demos>
  );
}
