import execa from 'execa'

export default ({ log = true, rootDir } = {}) =>
  execa(
    'nuxt',
    [
      'start',
      ...(rootDir !== undefined ? [rootDir] : []),
      '--config-file',
      require.resolve('./nuxt.config'),
    ],
    { stdio: log ? 'inherit' : 'ignore' }
  )
