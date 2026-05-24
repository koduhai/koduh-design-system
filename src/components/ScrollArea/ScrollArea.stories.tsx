import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './ScrollArea';

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>;
export default meta;

type Story = StoryObj<typeof meta>;

const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

export const Default: Story = {
  args: {
    maxHeight: 160,
    children: (
      <ul style={{ margin: 0, padding: '0 16px' }}>
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    ),
  },
};

export const Showcase: Story = {
  args: { children: 'Content' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Vertical (default)</h4>
        <ScrollArea
          maxHeight={140}
          style={{ border: '1px solid var(--ku-color-border)', borderRadius: 8, padding: 8 }}
        >
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </ScrollArea>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Horizontal</h4>
        <ScrollArea
          orientation="horizontal"
          style={{ border: '1px solid var(--ku-color-border)', borderRadius: 8, padding: 8 }}
        >
          <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
            {lines.map((l) => (
              <span
                key={l}
                style={{
                  flex: '0 0 auto',
                  padding: '4px 12px',
                  background: 'var(--ku-color-bg-surface)',
                  border: '1px solid var(--ku-color-border)',
                  borderRadius: 6,
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </ScrollArea>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Both axes</h4>
        <ScrollArea
          orientation="both"
          maxHeight={140}
          style={{ border: '1px solid var(--ku-color-border)', borderRadius: 8, padding: 8 }}
        >
          <div style={{ width: 600 }}>
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              {lines.map((l) => (
                <li key={l}>{l} — wide content that scrolls horizontally as well</li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </section>
    </div>
  ),
};
