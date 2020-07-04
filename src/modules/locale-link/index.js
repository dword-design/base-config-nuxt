import pushPlugins from '@dword-design/nuxt-push-plugins'
import P from 'path'

export default function () {
  this.addTemplate({
    fileName: P.join('nuxt-locale-link', 'nuxt-locale-link.vue'),
    src: require.resolve('./nuxt-locale-link.vue'),
  })
  pushPlugins(this, {
    fileName: P.join('nuxt-locale-link', 'plugin.js'),
    src: require.resolve('./plugin'),
  })
}
