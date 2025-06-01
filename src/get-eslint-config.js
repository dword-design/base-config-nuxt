import { endent } from '@dword-design/functions';

export default ({ virtualImports = [], ignore = [] } = {}) => endent`
  import config from '@dword-design/eslint-config';
  import { globalIgnores } from 'eslint/config';

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default withNuxt(
    globalIgnores([${['eslint.config.js', ...ignore].map(pattern => `'${pattern}'`).join(', ')}]),
    config,
    ${
      virtualImports.length > 0
        ? endent`
          {
            rules: {
              'import/no-unresolved': ['error', { ignore: [${virtualImports.map(_import => `'${_import}'`).join(', ')}] }],
            },
          },
        `
        : ''
    }
    {
      files: ['**/pages/**/*.{vue,js,ts}', 'server/api/**/*.{js,ts}'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  );
`;
