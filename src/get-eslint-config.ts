import packageName from 'depcheck-package-name';
import endent from 'endent';

type Options = { virtualImports?: string[]; ignore?: string[] };

export default ({ virtualImports = [], ignore = [] }: Options = {}) => endent`
  import config from '@dword-design/eslint-config';
  import { globalIgnores } from 'eslint/config';
  import vueI18n from '${packageName`@intlify/eslint-plugin-vue-i18n`}'

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default await withNuxt(
    globalIgnores([${['eslint.config.ts', 'eslint.lint-staged.config.ts', ...ignore].map(pattern => `'${pattern}'`).join(', ')}]),
    config,
    ...vueI18n.configs.recommended,
    {
      rules: {
        '@intlify/vue-i18n/no-dynamic-keys': 'error',
        '@intlify/vue-i18n/no-unused-keys': 'error',
      },
      settings: {
        'vue-i18n': {
          localeDir: './i18n/*.json',
          messageSyntaxVersion: '^10.0.0',
        }
      }
    },${
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
