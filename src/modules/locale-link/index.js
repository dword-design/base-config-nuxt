import { addPlugin, addTemplate, createResolver } from '@nuxt/kit'
import P from 'path'

const resolver = createResolver(import.meta.url)

export default () => {
  addTemplate({
    filename: P.join('nuxt-locale-link', 'component.vue'),
    src: resolver.resolve('./component.vue'),
    write: true,
  })
  addPlugin(
    {
      filename: P.join('nuxt-locale-link', 'plugin.js'),
      src: resolver.resolve('./plugin'),
    },
    { append: true },
  )
}
