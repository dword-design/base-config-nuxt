import execa from 'execa'

export default (options = {}) =>
  execa(
    'nuxt',
    [
      'start',
      ...(options.rootDir ? [options.rootDir] : []),
      '--config-file',
      require.resolve('./nuxt.config'),
    ],
    { stdio: options.log !== false ? 'inherit' : 'ignore' }
  )
