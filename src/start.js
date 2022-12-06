import { Nuxt } from 'nuxt'

import getNuxtConfig from './get-nuxt-config.js'

export default async (options = { log: false }) => {
  const nuxt = new Nuxt({
    ...getNuxtConfig(),
    build: { quiet: !options.log },
    dev: false,
    _start: true,
    rootDir: options.rootDir,
  })
  await nuxt.listen()

  return nuxt
}
