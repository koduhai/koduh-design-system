import type { Meta, StoryObj } from '@storybook/react-vite';
import { themes } from './tokens';

const meta: Meta = {
  title: 'Foundations/Colors',
};
export default meta;

type Story = StoryObj;

const camelToKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// Derive the token list from the source so docs cannot drift.
const colorTokens = Object.keys(themes.dark.color) as Array<keyof (typeof themes)['dark']['color']>;

export const Palette: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        color: 'var(--ku-color-text-primary)',
        fontFamily: 'var(--ku-font-family-base)',
      }}
    >
      {colorTokens.map((name) => {
        const varName = `--ku-color-${camelToKebab(String(name))}`;
        return (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              borderRadius: 'var(--ku-radius-md)',
              border: '1px solid var(--ku-color-border)',
              background: 'var(--ku-color-bg-surface)',
            }}
          >
            <div
              style={{
                height: 64,
                borderRadius: 'var(--ku-radius-sm)',
                border: '1px solid var(--ku-color-border)',
                background: `var(${varName})`,
              }}
            />
            <div
              style={{
                fontSize: 'var(--ku-font-size-sm)',
                fontWeight: 'var(--ku-font-weight-semibold)',
              }}
            >
              {name}
            </div>
            <code
              style={{
                fontFamily: 'var(--ku-font-family-mono)',
                fontSize: 'var(--ku-font-size-xs)',
                color: 'var(--ku-color-text-secondary)',
              }}
            >
              {varName}
            </code>
          </div>
        );
      })}
    </div>
  ),
};
