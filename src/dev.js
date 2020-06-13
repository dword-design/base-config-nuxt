import execa from 'execa'

export default () =>
  execa('nuxt-babel', ['--config-file', require.resolve('./nuxt.config')], {
    stdio: 'inherit',
  })
