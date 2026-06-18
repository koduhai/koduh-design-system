import { Chart } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-2)' }}>
      <span style={{ fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>{label}</span>
      {children}
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Line, bar, and minimal charts">
        <div style={{ ...row, gap: 'var(--ku-space-8)', alignItems: 'flex-start' }}>
          <Cell label="Multi-series line">
            <Chart
              type="line"
              categories={categories}
              series={[
                { name: 'Signups', data: [12, 19, 14, 23, 21] },
                { name: 'Active', data: [8, 11, 9, 15, 18] },
                { name: 'Churn', data: [3, 2, 4, 2, 1] },
              ]}
              aria-label="Signups, active, and churn over the week"
            />
          </Cell>
          <Cell label="Grouped bar">
            <Chart
              type="bar"
              categories={categories}
              series={[
                { name: 'Plan A', data: [12, 19, 14, 23, 21] },
                { name: 'Plan B', data: [8, 11, 9, 15, 18] },
              ]}
              aria-label="Plan A vs Plan B per day"
            />
          </Cell>
          <Cell label="No axes, custom color">
            <Chart
              type="line"
              showAxes={false}
              series={[
                {
                  name: 'Latency',
                  data: [40, 38, 52, 31, 45, 29],
                  color: 'var(--ku-color-chart-7)',
                },
              ]}
              aria-label="Request latency"
            />
          </Cell>
        </div>
      </DemoBlock>
    </Demos>
  );
}
