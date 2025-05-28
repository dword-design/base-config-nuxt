import { createRequire } from 'node:module';
import P from 'node:path';
import { fileURLToPath } from 'node:url';

import depcheckParserSass from '@dword-design/depcheck-parser-sass';
import { endent as javascript } from '@dword-design/functions';
import packageName from 'depcheck-package-name';
import depcheckParserVue from 'depcheck-parser-vue';
import outputFiles from 'output-files';

import analyze from './analyze.js';
import build from './build.js';
import depcheckSpecial from './depcheck-special.js';
import dev from './dev.js';
import eslintConfig from './eslint-config.js';
import lint from './lint.js';
import prepublishOnly from './prepublish-only.js';
import start from './start.js';

const __dirname = P.dirname(fileURLToPath(import.meta.url));
const resolver = createRequire(import.meta.url);
const isInNodeModules = __dirname.split(P.sep).includes('node_modules');

export default {
  allowedMatches: [
    '.stylelintrc.json',
    'server/api/**/*.js',
    'server/plugins/**/*.js',
    'server/routes/**/*.js',
    'server/middleware/**/*.js',
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
    'config.js',
    'pages',
    'plugins',
    'public',
    'store',
    'types',
  ],
  commands: { analyze, build, dev, prepublishOnly, start },
  depcheckConfig: {
    parsers: { '**/*.scss': depcheckParserSass, '**/*.vue': depcheckParserVue },
    specials: [depcheckSpecial],
  },
  editorIgnore: [
    '.stylelintcache',
    '.stylelintrc.json',
    '.nuxt',
    '.output',
    'dist',
    'nuxt.config.js',
  ],
  eslintConfig,
  gitignore: [
    '/.nuxt',
    '/.output',
    '/.stylelintcache',
    '/dist',
    '/nuxt.config.js',
  ],
  lint,
  npmPublish: true,
  packageConfig: { main: 'dist/index.js' },
  prepare: async () => {
    const configPath = isInNodeModules
      ? '@dword-design/base-config-nuxt/config'
      : `./${P.relative(process.cwd(), resolver.resolve('./config.js'))
          .split(P.sep)
          .join('/')}`;

    const parentConfigPath = isInNodeModules
      ? '@dword-design/base-config-nuxt/nuxt.config'
      : `./${P.relative(process.cwd(), resolver.resolve('./nuxt.config.js'))
          .split(P.sep)
          .join('/')}`;

    await outputFiles({
      '.stylelintrc.json': `${JSON.stringify(
        { extends: packageName`@dword-design/stylelint-config` },
        undefined,
        2,
      )}\n`,
      'nuxt.config.js': javascript`
        import config from '${configPath}';

        export default {
          extends: ['${parentConfigPath}'],
          ...config,
        };\n
      `,
    });
  },
  useJobMatrix: true,
};
