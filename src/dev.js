import { Builder, Nuxt } from 'nuxt'
import config from './nuxt.config.js'

export default async () => {
  const nuxt = new Nuxt(config)
  await new Builder(nuxt).build()
  await nuxt.listen()
  return nuxt
}