import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { KoduhThemeProvider } from '../src/provider';
import type { ColorMode } from '../src/theme';
import '../src/styles/reset.css';

// theme.css must exist (run `npm run build:tokens` once); import the generated vars.
import '../dist/theme.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme as ColorMode;
      useEffect(() => {
        document.documentElement.setAttribute('data-theme', mode);
      }, [mode]);
      return (
        <KoduhThemeProvider defaultMode={mode} disablePersistence>
          <div style={{ padding: 24, minHeight: '100vh' }}>
            <Story />
          </div>
        </KoduhThemeProvider>
      );
    },
  ],
  parameters: {
    backgrounds: { disable: true },
  },
};

export default preview;
