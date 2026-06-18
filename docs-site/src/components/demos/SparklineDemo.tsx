import { Sparkline } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const series = [4, 8, 6, 12, 9, 14, 11, 18, 16, 22];

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-1)' }}>
      <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>{label}</span>
      {children}
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Sparkline shapes and colors">
        <div style={{ ...row, gap: 'var(--ku-space-6)' }}>
          <Cell label="line">
            <Sparkline data={series} type="line" aria-label="Line sparkline" />
          </Cell>
          <Cell label="area">
            <Sparkline data={series} type="area" aria-label="Area sparkline" />
          </Cell>
          <Cell label="bar">
            <Sparkline data={series} type="bar" aria-label="Bar sparkline" />
          </Cell>
          <Cell label="chart-3">
            <Sparkline
              data={series}
              type="area"
              color="var(--ku-color-chart-3)"
              aria-label="Amber area sparkline"
            />
          </Cell>
        </div>
      </DemoBlock>
      <DemoBlock caption="Inline trend">
        <span style={{ fontSize: 14 }}>
          Revenue{' '}
          <Sparkline
            data={series}
            width={64}
            height={18}
            color="var(--ku-color-chart-2)"
            aria-label="Revenue inline trend"
          />{' '}
          +22%
        </span>
      </DemoBlock>
    </Demos>
  );
}
