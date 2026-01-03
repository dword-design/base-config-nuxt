import endent from 'endent';

type Options = { ignore?: string[] };

export default ({ ignore = [] }: Options = {}) => endent`
  import config from '@dword-design/eslint-config';
  import { globalIgnores } from 'eslint/config';

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default await withNuxt(
    globalIgnores([${['eslint.config.ts', 'eslint.lint-staged.config.ts', ...ignore].map(pattern => `'${pattern}'`).join(', ')}]),
    config,
    {
      files: ['**/pages/**/*.{vue,ts}', 'server/api/**/*.ts'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ).toConfigs();\n
`;
