import endent from 'endent';

type Options = { virtualImports?: string[]; ignore?: string[] };

export default ({ virtualImports = [], ignore = [] }: Options = {}) => endent`
  import config from '@dword-design/eslint-config';
  import { globalIgnores } from 'eslint/config';

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default await withNuxt(
    globalIgnores([${['eslint.config.ts', 'eslint.lint-staged.config.ts', ...ignore].map(pattern => `'${pattern}'`).join(', ')}]),
    config,${
      virtualImports.length > 0
        ? endent`
          \n{
            rules: {
              'import-x/no-unresolved': ['error', { ignore: [${virtualImports.map(_import => `'${_import}'`).join(', ')}] }],
            },
          },
        `
        : ''
    }
    {
      files: ['**/pages/**/*.{vue,ts}', 'server/api/**/*.ts'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ).toConfigs();\n
`;
