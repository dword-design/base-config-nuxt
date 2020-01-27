import nodeEnv from 'better-node-env'
import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'

export default {
  ...nodeConfig,
  build: () => spawn('webpack-cli', ['--config', require.resolve('./webpack.config')], { stdio: 'inherit' }),
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
  gitignore: [...nodeConfig.gitignore, '.linaria-cache'],
}
