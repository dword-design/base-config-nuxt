import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'
import depcheckConfig from '@dword-design/depcheck-config'
import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import nuxtConfig from './nuxt.config'

export default {
  ...nodeConfig,
  depcheckConfig: {
    ...depcheckConfig,
    parsers: {
      ...depcheckConfig.parsers,
      '*.scss': depcheckSassParser,
    },
  },
  commands: {
    dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    prepublishOnly: async () => {
      await nodeConfig.commands.prepublishOnly()
      await spawn('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' })
    },
    analyze: () => spawn(
      'nuxt',
      ['build', '--analyze', '--config-file', require.resolve('./nuxt.config')],
      { stdio: 'inherit' },
    ),
    start: () => spawn(
      'nuxt',
      ['start', '--config-file', require.resolve('./nuxt.config')],
      { stdio: 'inherit' },
    ),
  },
  nuxtConfig,
  nuxtConfigFilename: require.resolve('./nuxt.config'),
}
