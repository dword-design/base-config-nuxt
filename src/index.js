import nodeConfig from '@dword-design/base-config-node'
import depcheckConfig from '@dword-design/depcheck-config'
import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import { outputFile } from 'fs-extra'
import nuxtConfig from './nuxt.config'
import dev from './dev'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import analyze from './analyze'
import start from './start'
import depcheckSpecial from './depcheck-special'
import depcheckVueParser from './depcheck-vue-parser'
import eslintConfig from './eslint.config'

export default {
  ...nodeConfig,
  depcheckConfig: {
    ...depcheckConfig,
    parsers: {
      ...depcheckConfig.parsers,
      '*.scss': depcheckSassParser,
      '*.vue': depcheckVueParser,
    },
    specials: [...depcheckConfig.specials, depcheckSpecial],
  },
  allowedMatches: [
    'api',
    'assets',
    'components',
    'i18n',
    'layouts',
    'modules',
    'nuxt.config.js',
    'pages',
    'model',
    'static',
    'store',
  ],
  prepare: () =>
    outputFile('.eslintrc.json', JSON.stringify(eslintConfig, undefined, 2)),
  test: lint,
  commands: {
    dev,
    prepublishOnly,
    analyze,
    start,
  },
  nuxtConfig,
  nuxtConfigFilename: require.resolve('./nuxt.config'),
}
