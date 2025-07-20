import { createRequire } from 'node:module';
import pathLib from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Config } from '@dword-design/base';
import { defineBaseConfig } from '@dword-design/base';
import depcheckParserSass from '@dword-design/depcheck-parser-sass';
import depcheck from 'depcheck';
import packageName from 'depcheck-package-name';
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

const __dirname = pathLib.dirname(fileURLToPath(import.meta.url));
const resolver = createRequire(import.meta.url);
const isInNodeModules = __dirname.split(pathLib.sep).includes('node_modules');
type ConfigNuxt = Config & { virtualImports?: string[] };

export default defineBaseConfig(function (config: ConfigNuxt) {
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
        '**/*.vue': depcheck.parser.vue,
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
    hasTypescriptConfigRootAlias: false,
    lint,
    npmPublish: true,
    packageConfig: { main: 'dist/index.js' },
    prepare: async () => {
      const configPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/config'
        : `./${pathLib
            .relative(
              this.cwd,
              resolver.resolve('./config').slice(0, -'.ts'.length),
            )
            .split(pathLib.sep)
            .join('/')}`;

      const parentConfigPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/nuxt.config'
        : `./${pathLib
            .relative(
              this.cwd,
              resolver.resolve('./nuxt.config').slice(0, -'.ts'.length),
            )
            .split(pathLib.sep)
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
    typescriptConfig: {
      compilerOptions: {
        declaration: false, // TypeScript errors that declaration cannot be generated for private router types. Comes from the Nuxt-generated TypeScript config.
      },
      extends: './.nuxt/tsconfig.json',
    },
    useJobMatrix: true,
  };
});

export { default as getEslintConfig } from './get-eslint-config';
