import { createRequire } from 'node:module';
import pathLib from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Base } from '@dword-design/base';
import { defineBaseConfig } from '@dword-design/base';
import depcheckParserSass from '@dword-design/depcheck-parser-sass';
import depcheck from 'depcheck';
import binName from 'depcheck-bin-name';
import packageName from 'depcheck-package-name';
import javascript from 'endent';
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

export default defineBaseConfig(function (this: Base) {
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
      'app/layouts/*.vue',
      'app/lib/**/*.ts',
      'app/middleware/*.ts',
      'app/pages/**/*.vue',
      'app/pages/**/*.spec.ts',
      'app/plugins/*.ts',
      'app/types/*.ts',
      'app/utils/**/*.ts',
      'modules',
      'config.ts',
      'public',
      'shared/lib/**/*.ts',
      'shared/utils/**/*.ts',
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
    eslintConfig: getEslintConfig(),
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
      files: [],
      references: [
        /**
         * TODO: I needed to swap app and server here because otherwise eslint-plugin-import-x
         * (via the TypeScript resolver) won't find #auth in a server file. According to
         * https://nuxt.com/docs/4.x/directory-structure/tsconfig, app should be first though.
         */
        { path: './.nuxt/tsconfig.server.json' },
        { path: './.nuxt/tsconfig.app.json' },
        { path: './.nuxt/tsconfig.shared.json' },
        { path: './.nuxt/tsconfig.node.json' },
      ],
      vueCompilerOptions: {
        cssModulesLocalsConvention: 'camelCaseOnly',
        strictCssModules: true,
      },
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
