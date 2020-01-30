import { spawn } from 'child-process-promise'
import nodeConfig from '@dword-design/base-config-node'

export default {
  dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  build: () => spawn('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  start: () => spawn('nuxt', ['start', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  gitignore: [...nodeConfig.gitignore, '.linaria-cache', '.nuxt'],
}
