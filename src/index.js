import { spawn } from 'child-process-promise'

export default {
  gitignore: ['.linaria-cache', '.nuxt'],
  commands: {
    dev: () => spawn('nuxt', ['--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    prepublishOnly: () => spawn('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
    start: () => spawn('nuxt', ['start', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' }),
  },
}
