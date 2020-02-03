import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'

export default {
  gitignore: ['.acss', '.nuxt'],
  test: nodeConfig.test,
  commands: {
    dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    prepublishOnly: () => spawn('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    analyze: () => spawn('nuxt', ['build', '--analyze', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    start: () => spawn('nuxt', ['start', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  },
}
