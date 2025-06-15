import endent from 'endent';

export default ({ virtualImports = [], ignore = [] } = {}) => endent`
  import config from '@dword-design/eslint-config';
  import { globalIgnores } from 'eslint/config';

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default withNuxt(
    globalIgnores([${['eslint.config.ts', ...ignore].map(pattern => `'${pattern}'`).join(', ')}]),
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
  );
`;
