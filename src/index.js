import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import { endent as javascript } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import { createRequire } from 'module'
import outputFiles from 'output-files'
import P from 'path'
import { fileURLToPath } from 'url'

import analyze from './analyze.js'
import depcheckSpecial from './depcheck-special.js'
import dev from './dev.js'
import getEslintConfig from './get-eslint-config.js'
import lint from './lint.js'
import prepublishOnly from './prepublish-only.js'
import start from './start.js'

const __dirname = P.dirname(fileURLToPath(import.meta.url))

const _require = createRequire(import.meta.url)

const isInNodeModules = __dirname.split(P.sep).includes('node_modules')

export default (config = {}) => {
  config.importAliases = config.importAliases || []

  return {
    allowedMatches: [
      '.stylelintrc.json',
      'server/api/**/*.js',
      'server/plugins/**/*.js',
      'server/routes/**/*.js',
      'server/middleware/**/*.js',
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
    commands: {
      analyze,
      dev,
      prepublishOnly,
      start,
    },
    depcheckConfig: {
      parsers: {
        '**/*.scss': depcheckParserSass,
        '**/*.vue': depcheckParserVue,
      },
      specials: [depcheckSpecial],
    },
    editorIgnore: [
      '.eslintcache',
      '.stylelintcache',
      '.stylelintrc.json',
      '.nuxt',
      '.output',
      'dist',
      'nuxt.config.js',
    ],
    eslintConfig: getEslintConfig(config),
    gitignore: [
      '/.eslintcache',
      '/.nuxt',
      '/.output',
      '/.stylelintcache',
      '/dist',
      '/nuxt.config.js',
    ],
    lint,
    npmPublish: true,
    packageConfig: {
      main: 'dist/index.js',
    },
    prepare: async () => {
      const configPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/config'
        : `./${P.relative(process.cwd(), _require.resolve('./config.js'))
            .split(P.sep)
            .join('/')}`

      const parentConfigPath = isInNodeModules
        ? '@dword-design/base-config-nuxt/nuxt.config'
        : `./${P.relative(process.cwd(), _require.resolve('./nuxt.config.js'))
            .split(P.sep)
            .join('/')}`
      await outputFiles({
        '.stylelintrc.json': `${JSON.stringify(
          {
            extends: packageName`@dword-design/stylelint-config`,
          },
          undefined,
          2,
        )}\n`,
        'nuxt.config.js': javascript`
          import deepmerge from '${packageName`deepmerge`}'
          import config from '${configPath}'
          import parentConfig from '${parentConfigPath}'

          export default deepmerge(parentConfig, config)\n
        `,
      })
    },
    useJobMatrix: true,
  }
}
