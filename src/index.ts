import { createRequire } from 'node:module';
import pathLib from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Base, Config } from '@dword-design/base';
import { defineBaseConfig } from '@dword-design/base';
import depcheckParserSass from '@dword-design/depcheck-parser-sass';
import depcheck from 'depcheck';
import binName from 'depcheck-bin-name';
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
import typecheck from './typecheck';

const __dirname = pathLib.dirname(fileURLToPath(import.meta.url));
const resolver = createRequire(import.meta.url);
const isInNodeModules = __dirname.split(pathLib.sep).includes('node_modules');

type ConfigNuxt = Config & { virtualImports?: string[] };

export default defineBaseConfig(function (this: Base, config: ConfigNuxt) {
  return {
    allowedMatches: [
      '.stylelintignore',
      '.stylelintrc.json',
      'server/api/**/*.ts',
      'server/plugins/**/*.ts',
      'server/routes/**/*.ts',
      'server/middleware/**/*.ts',
      'server/utils/**/*.ts',
      'app/app.vue',
      'app/assets',
      'app/components/**/*.vue',
      'app/composables/*.ts',
      'content',
      'i18n/*/*.ts',
      'app/layouts/*.vue',
      'app/middleware/*.ts',
      'app/pages/**/*.vue',
      'app/pages/**/*.spec.ts',
      'app/plugins/*.ts',
      'app/utils/*.ts',
      'model',
      'modules',
      'config.ts',
      'public',
      'shared/utils/*.ts',
      'shared/types/*.ts',
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
    lintStagedConfig: { '*.{css,scss,vue}': `${binName`stylelint`} --fix` },
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
    typecheck,
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

// TODO: Otherwise the full type of the config cannot be inferred by TypeScript when used somewhere else

export { default as dev } from './dev';

export { default as analyze } from './analyze';

export { default as prepublishOnly } from './prepublish-only';

export { default as build } from './build';

export { default as typecheck } from './typecheck';

export { default as lint } from './lint';

export { default as start } from './start';
