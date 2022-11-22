import execa from 'execa'
import fs from 'fs-extra'
import { Builder, Nuxt } from 'nuxt'

import lint from './lint.js'
import getNuxtConfig from './get-nuxt-config.js'

export default async (options = {}) => {
  await lint()
  const nuxt = new Nuxt({ ...getNuxtConfig(), dev: false, rootDir: options.rootDir })
  await new Builder(nuxt).build()
  if (await fs.exists('model')) {
    await fs.remove('dist')
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
