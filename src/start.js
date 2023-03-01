import { loadNuxt } from '@nuxt/kit'
import { build } from 'nuxt'
import { pEvent } from 'p-event'

import getNuxtConfig from './get-nuxt-config.js'

export default async (options = { log: false }) => {
  const nuxt = await loadNuxt({
    config: {
      ...getNuxtConfig(),
      build: { quiet: !options.log },
      ...(!options.log && { vite: { logLevel: 'error' } }),
      rootDir: options.rootDir,
    },
  })
  await build(nuxt)

  const childProcess = execaCommand('nuxt start', { all: true })
  await pEvent(
    childProcess.all,
    'data',
    data => data.toString() === 'Listening http://[::]:3000\n'
  )

  return childProcess
}
