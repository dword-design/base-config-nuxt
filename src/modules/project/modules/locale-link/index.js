import { createRequire } from 'module'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'

const _require = createRequire(import.meta.url)

export default function () {
  this.addTemplate({
    fileName: P.join('nuxt-locale-link', 'nuxt-locale-link.vue'),
    src: _require.resolve('./nuxt-locale-link.vue'),
  })
  nuxtPushPlugins(this, {
    fileName: P.join('nuxt-locale-link', 'plugin.js'),
    src: _require.resolve('./plugin'),
  })
}
