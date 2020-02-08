import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'
import depcheckConfig from '@dword-design/depcheck-config'
import depcheckSassParser from '@dword-design/depcheck-sass-parser'

export default {
  depcheckConfig: {
    ...depcheckConfig,
    parsers: {
      ...depcheckConfig.parsers,
      '*.scss': depcheckSassParser,
    },
  },
  gitignore: ['.acss', '.nuxt'],
  test: nodeConfig.test,
  commands: {
    dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    prepublishOnly: () => spawn('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    analyze: () => spawn('nuxt', ['build', '--analyze', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    start: () => spawn('nuxt', ['start', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  },
}
