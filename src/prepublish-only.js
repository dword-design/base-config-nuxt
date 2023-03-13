import { buildNuxt, loadNuxt } from '@nuxt/kit'
import { execa } from 'execa'
import fs from 'fs-extra'

import lint from './lint.js'

export default async (options = {}) => {
  await lint()

  const nuxt = await loadNuxt({
    ...(options.log === false
      ? { overrides: { vite: { logLevel: 'error' } } }
      : {}),
  })
  await buildNuxt(nuxt)
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
      { stdio: options.log === false ? 'ignore' : 'inherit' },
    )
  }
}
