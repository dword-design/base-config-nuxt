import execa from 'execa'

export default () =>
  execa('nuxt', ['--config-file', require.resolve('./nuxt.config')], {
    stdio: 'inherit',
  })
