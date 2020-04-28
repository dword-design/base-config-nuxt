import { Nuxt, Builder } from 'nuxt'
import execa from 'execa'
import { remove, copy, stat } from 'fs-extra'
import getPackageName from 'get-package-name'
import lint from './lint'
import nuxtConfig from './nuxt.config'

export default async () => {
  await lint()
  await remove('dist')
  await copy(
    'src',
    'dist',
    { filter: async file => (file |> stat |> await).isDirectory() || !file.endsWith('.js') },
  )
  await execa(
    'babel',
    [
      '--config-file', getPackageName(require.resolve('@dword-design/babel-config')),
      '--out-dir', 'dist',
      '--ignore', '**/*.spec.js',
      'src',
    ],
    { stdio: 'inherit' },
  )
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  return new Builder(nuxt).build()
}
