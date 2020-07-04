import execa from 'execa'

export default (options = {}) =>
  execa(
    'nuxt-babel',
    [
      'start',
      ...(options.rootDir ? [options.rootDir] : []),
      '--config-file',
      require.resolve('./nuxt.config'),
    ],
    { stdio: options.log === false ? 'ignore' : 'inherit' }
  )
