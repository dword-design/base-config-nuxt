import { loadNuxt } from '@nuxt/kit'
import { execa } from 'execa'
import fs from 'fs-extra'
import { build } from 'nuxt'

import getNuxtConfig from './get-nuxt-config.js'
import lint from './lint.js'

export default async (options = {}) => {
  await lint()

  const nuxt = await loadNuxt({
    config: {
      ...getNuxtConfig(),
      rootDir: options.rootDir,
    },
  })
  await build(nuxt)
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
