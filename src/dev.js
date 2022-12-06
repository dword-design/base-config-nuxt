import { Builder, Nuxt } from 'nuxt'

import getNuxtConfig from './get-nuxt-config.js'

export default async nuxtConfig => {
  const nuxt = new Nuxt({
    ...getNuxtConfig(),
    _build: true,
    dev: true,
    ...nuxtConfig,
  })
  await new Builder(nuxt).build()
  await nuxt.listen()

  return nuxt
}
