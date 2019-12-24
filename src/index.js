import nodeEnv from 'better-node-env'
import { spawn } from 'child-process-promise'
import babelConfig from '@dword-design/babel-config-vue'
import depcheckConfig from '@dword-design/depcheck-config-vue'

export default {
  babelConfig,
  build: () => spawn('webpack-cli', ['--config', require.resolve('./webpack.config')], { stdio: 'inherit' }),
  depcheckConfig,
  start: () => {
    if (nodeEnv !== 'production') {
      return spawn('webpack-dev-server', ['--config', require.resolve('./webpack.config')], { stdio: 'inherit' })
    }
  },
  ...nodeEnv !== 'production'
    ? {
      commands: {
        analyze: {
          description: 'Analyzes bundle sizes',
          handler: () => spawn('webpack-cli', ['--config', require.resolve('./analyze.webpack.config')], { stdio: 'inherit' }),
        },
      },
    }
    : {},
  gitignore: ['.linaria-cache'],
}
