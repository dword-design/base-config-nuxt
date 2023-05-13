import { execa, execaCommand } from 'execa'
import fs from 'fs-extra'

import lint from './lint.js'

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options }
  await lint()
  await execaCommand('nuxt build', {
    ...(options.log ? { stdio: 'inherit' } : {}),
    ...(process.env.NODE_ENV === 'test'
      ? { env: { NUXT_TELEMETRY_DISABLED: 1 } }
      : {}),
  })
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
      ...(options.log ? [{ stdio: 'inherit' }] : []),
    )
  }
}
