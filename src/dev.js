import { loadNuxt } from '@nuxt/kit'
import { build } from 'nuxt'

import getNuxtConfig from './get-nuxt-config.js'

export default async nuxtConfig => {
  const nuxt = await loadNuxt({ dev: true, config: { ...getNuxtConfig(), ...nuxtConfig } })
  await build(nuxt)
  await nuxt.listen()

  return nuxt
}
