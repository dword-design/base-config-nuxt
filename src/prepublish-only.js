import { Nuxt, Builder } from 'nuxt'
import execa from 'execa'
import { remove, exists } from 'fs-extra'
import getPackageName from 'get-package-name'
import lint from './lint'
import nuxtConfig from './nuxt.config'

export default async () => {
  await lint({ excludeVueFiles: true })
  if (await exists('model')) {
    await remove('dist')
    await execa(
      'babel',
      [
        '--config-file',
        getPackageName(require.resolve('@dword-design/babel-config')),
        '--out-dir',
        'dist',
        '--copy-files',
        '--no-copy-ignored',
        '--ignore',
        '**/*.spec.js',
        'model',
      ],
      { stdio: 'inherit' }
    )
  }
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  return new Builder(nuxt).build()
}
