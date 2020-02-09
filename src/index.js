import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'
import depcheckConfig from '@dword-design/depcheck-config'
import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import getPackageName from 'get-package-name'

export default {
  depcheckConfig: {
    ...depcheckConfig,
    parsers: {
      ...depcheckConfig.parsers,
      '*.scss': depcheckSassParser,
    },
  },
  test: nodeConfig.test,
  commands: {
    dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    prepublishOnly: async () => {
      await spawn(
        'babel',
        [
          '--config-file', getPackageName(require.resolve('@dword-design/babel-config')),
          '--out-dir', 'dist',
          'src',
        ],
        { stdio: 'inherit' },
      )
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
}
