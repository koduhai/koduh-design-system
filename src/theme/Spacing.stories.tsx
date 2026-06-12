import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from './tokens';

const meta: Meta = {
  title: 'Foundations/Spacing',
};
export default meta;

type Story = StoryObj;

const camelToKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const sectionStyle: React.CSSProperties = {
  color: 'var(--ku-color-text-primary)',
  fontFamily: 'var(--ku-font-family-base)',
};

const headingStyle: React.CSSProperties = {
  fontSize: 'var(--ku-font-size-lg)',
  fontWeight: 'var(--ku-font-weight-bold)',
  margin: '24px 0 12px',
};

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--ku-font-family-mono)',
  fontSize: 'var(--ku-font-size-xs)',
  color: 'var(--ku-color-text-secondary)',
};

const spaceEntries = Object.entries(tokens.space);
const radiusEntries = Object.entries(tokens.radius);
const shadowEntries = Object.entries(tokens.shadow);

export const Spacing: Story = {
  render: () => (
    <div style={sectionStyle}>
      <h2 style={headingStyle}>Spacing</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {spaceEntries.map(([key, value]) => {
          const varName = `--ku-space-${camelToKebab(String(key))}`;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: `var(${varName})`,
                  height: 16,
                  background: 'var(--ku-color-primary)',
                  borderRadius: 'var(--ku-radius-sm)',
                  flexShrink: 0,
                }}
              />
              <code style={metaStyle}>
                {key} · {varName} · {value}
              </code>
            </div>
          );
        })}
      </div>

      <h2 style={headingStyle}>Radii</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {radiusEntries.map(([key, value]) => {
          const varName = `--ku-radius-${camelToKebab(key)}`;
          return (
            <div
              key={key}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: 'var(--ku-color-bg-raised)',
                  border: '1px solid var(--ku-color-border)',
                  borderRadius: `var(${varName})`,
                }}
              />
              <code style={metaStyle}>
                {key} · {value}
              </code>
            </div>
          );
        })}
      </div>

      <h2 style={headingStyle}>Shadows</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {shadowEntries.map(([key]) => {
          const varName = `--ku-shadow-${camelToKebab(String(key))}`;
          return (
            <div
              key={key}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  background: 'var(--ku-color-bg-raised)',
                  borderRadius: 'var(--ku-radius-md)',
                  boxShadow: `var(${varName})`,
                }}
              />
              <code style={metaStyle}>
                {key} · {varName}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  ),
};
