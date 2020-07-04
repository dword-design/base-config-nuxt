import execa from 'execa'
import { exists, remove } from 'fs-extra'

import lint from './lint'

export default async (options = {}) => {
  await lint()
  await execa(
    'nuxt-babel',
    [
      'build',
      ...(options.rootDir ? [options.rootDir] : []),
      '--config-file',
      require.resolve('./nuxt.config'),
    ],
    { stdio: options.log === false ? 'ignore' : 'inherit' }
  )
  if (await exists('model')) {
    await remove('dist')
    await execa(
      'babel',
      [
        '--out-dir',
        'dist',
        '--copy-files',
        '--no-copy-ignored',
        '--ignore',
        '**/*.spec.js',
        'model',
      ],
      { stdio: options.log === false ? 'ignore' : 'inherit' }
    )
  }
}
