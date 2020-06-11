import depcheckConfig from '@dword-design/depcheck-config-vue'
import { outputFile } from 'fs-extra'
import nuxtConfig from './nuxt.config'
import dev from './dev'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import analyze from './analyze'
import start from './start'
import depcheckSpecial from './depcheck-special'
import eslintConfig from './eslint.config'

export default {
  depcheckConfig: {
    ...depcheckConfig,
    specials: [...depcheckConfig.specials, depcheckSpecial],
  },
  allowedMatches: [
    'api',
    'assets',
    'auth-plugins',
    'auth-schemes',
    'components',
    'i18n',
    'layouts',
    'model',
    'modules',
    'nuxt.config.js',
    'pages',
    'plugins',
    'static',
    'store',
    'types',
  ],
  gitignore: ['/.eslintrc.json'],
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
  npmPublish: true,
  useJobMatrix: true,
}
