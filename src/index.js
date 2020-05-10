import nodeConfig from '@dword-design/base-config-node'
import depcheckConfig from '@dword-design/depcheck-config'
import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import nuxtConfig from './nuxt.config'
import dev from './dev'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import analyze from './analyze'
import start from './start'
import depcheckSpecial from './depcheck-special'

export default {
  ...nodeConfig,
  depcheckConfig: {
    ...depcheckConfig,
    parsers: {
      ...depcheckConfig.parsers,
      '*.scss': depcheckSassParser,
    },
    specials: [
      ...depcheckConfig.specials,
      depcheckSpecial,
    ],
  },
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
