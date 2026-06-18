import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // docs-site/ and mcp/ are independent workspaces with their own toolchains;
  // the library's strict config does not lint them.
  { ignores: ['dist', 'storybook-static', 'node_modules', 'examples', 'docs-site', 'mcp'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
);
