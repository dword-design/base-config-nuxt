import dedent from 'dedent';

export default {
  depcheckConfig: { ignoreMatches: ['playwright-chromium'] },
  eslintConfig: dedent`
    import config from '@dword-design/eslint-config';
    import { defineConfig } from 'eslint/config';

    export default defineConfig([
      config,
      { rules: { 'import/no-unresolved': ['error', { ignore: ['#imports'] }] } },
      {
        files: ['eslint.config.js'],
        rules: { 'import/no-extraneous-dependencies': 'off' },
      },
    ]);\n
  `,
  macos: false,
  name: '@dword-design/node',
};
