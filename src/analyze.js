import execa from 'execa'

export default () =>
  execa(
    'nuxt',
    ['build', '--analyze', '--config-file', require.resolve('./nuxt.config')],
    { stdio: 'inherit' }
  )
