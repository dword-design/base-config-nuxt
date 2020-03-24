import nodeConfig from '@dword-design/base-config-node'
import { Nuxt, Builder } from 'nuxt'
import nuxtConfig from './nuxt.config'

export default async () => {
  await nodeConfig.commands.prepublishOnly()
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  return new Builder(nuxt).build()
}
