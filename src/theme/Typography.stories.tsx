import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from './tokens';

const meta: Meta = {
  title: 'Foundations/Typography',
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

const fontSizeEntries = Object.entries(tokens.fontSize);
const fontWeightEntries = Object.entries(tokens.fontWeight);
const lineHeightEntries = Object.entries(tokens.lineHeight);
const fontFamilyEntries = Object.entries(tokens.fontFamily);

export const Scale: Story = {
  render: () => (
    <div style={sectionStyle}>
      <h2 style={headingStyle}>Font sizes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {fontSizeEntries.map(([key, value]) => {
          const varName = `--ku-font-size-${camelToKebab(key)}`;
          return (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: `var(${varName})` }}>The quick brown fox</span>
              <code style={metaStyle}>
                {key} · {varName} · {value}
              </code>
            </div>
          );
        })}
      </div>

      <h2 style={headingStyle}>Font weights</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fontWeightEntries.map(([key, value]) => {
          const varName = `--ku-font-weight-${camelToKebab(key)}`;
          return (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: 'var(--ku-font-size-lg)', fontWeight: `var(${varName})` }}>
                The quick brown fox
              </span>
              <code style={metaStyle}>
                {key} · {varName} · {value}
              </code>
            </div>
          );
        })}
      </div>

      <h2 style={headingStyle}>Line heights</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lineHeightEntries.map(([key, value]) => {
          const varName = `--ku-line-height-${camelToKebab(key)}`;
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <code style={metaStyle}>
                {key} · {varName} · {value}
              </code>
              <p
                style={{
                  margin: 0,
                  maxWidth: 520,
                  fontSize: 'var(--ku-font-size-md)',
                  lineHeight: `var(${varName})`,
                  border: '1px solid var(--ku-color-border)',
                  borderRadius: 'var(--ku-radius-sm)',
                  padding: 8,
                }}
              >
                The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy
                dog.
              </p>
            </div>
          );
        })}
      </div>

      <h2 style={headingStyle}>Font families</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {fontFamilyEntries.map(([key, value]) => {
          const varName = `--ku-font-family-${camelToKebab(key)}`;
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: `var(${varName})`, fontSize: 'var(--ku-font-size-lg)' }}>
                The quick brown fox jumps over the lazy dog
              </span>
              <code style={metaStyle}>
                {key} · {varName} · {value}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  ),
};
