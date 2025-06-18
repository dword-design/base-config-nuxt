import { createRequire } from 'node:module';
import P from 'node:path';
import { fileURLToPath } from 'node:url';

import depcheckParserSass from '@dword-design/depcheck-parser-sass';
import packageName from 'depcheck-package-name';
import depcheckParserVue from 'depcheck-parser-vue';
import javascript from 'endent';
import { pick } from 'lodash-es';
import outputFiles from 'output-files';

import analyze from './analyze';
import build from './build';
import dev from './dev';
import getDepcheckSpecial from './get-depcheck-special';
import getEslintConfig from './get-eslint-config';
import lint from './lint';
import prepublishOnly from './prepublish-only';
import start from './start';

const __dirname = P.dirname(fileURLToPath(import.meta.url));
const resolver = createRequire(import.meta.url);
const isInNodeModules = __dirname.split(P.sep).includes('node_modules');

export default function (config) {
  return {
    allowedMatches: [
      '.stylelintignore',
      '.stylelintrc.json',
      'server/api/**/*.ts',
      'server/plugins/**/*.ts',
      'server/routes/**/*.ts',
      'server/middleware/**/*.ts',
      'app.vue',
      'assets',
      'components',
      'composables',
      'content',
      'i18n',
      'layouts',
      'middleware',
      'model',
      'modules',
      'config.ts',
      'pages',
      'plugins',
      'public',
      'store',
      'types',
    ],
    commands: { analyze, build, dev, prepublishOnly, start },
    depcheckConfig: {
      parsers: {
        '**/*.scss': depcheckParserSass,
        '**/*.vue': depcheckParserVue,
      },
      specials: [getDepcheckSpecial({ cwd: this.cwd })],
    },
    editorIgnore: [
      '.eslintcache',
      '.stylelintcache',
      '.stylelintignore',
      '.stylelintrc.json',
      '.nuxt',
      '.output',
      'dist',
      'nuxt.config.ts',
    ],
    eslintConfig: getEslintConfig(pick(config, ['virtualImports'])),
    gitignore: [
      '/.eslintcache',
      '/.nuxt',
      '/.output',
      '/.stylelintcache',
      '/dist',
      '/nuxt.config.ts',
    ],
    lint,
    npmPublish: true,
    packageConfig: { main: 'dist/index.js' },
    prepare: async () => {
      const configPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/config'
        : `./${P.relative(this.cwd, resolver.resolve('./config'))
            .split(P.sep)
            .join('/')}`;

      const parentConfigPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/nuxt.config'
        : `./${P.relative(this.cwd, resolver.resolve('./nuxt.config'))
            .split(P.sep)
            .join('/')}`;

      await outputFiles(this.cwd, {
        '.stylelintignore': '/.nuxt\n', // For Tailwind directives inside .nuxt folder
        '.stylelintrc.json': `${JSON.stringify(
          { extends: packageName`@dword-design/stylelint-config` },
          undefined,
          2,
        )}\n`,
        'nuxt.config.ts': javascript`
          import config from '${configPath}';

          export default {
            extends: ['${parentConfigPath}'],
            ...config,
          };\n
        `,
      });
    },
    useJobMatrix: true,
    "hasTypescriptConfigRootAlias": false,
    "typescriptConfig": { "extends": "./.nuxt/tsconfig.json" },
  };
}

export { default as getEslintConfig } from './get-eslint-config';
