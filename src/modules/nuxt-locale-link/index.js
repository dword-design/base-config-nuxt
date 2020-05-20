import pushPlugins from '@dword-design/nuxt-push-plugins'
import P from 'path'

export default function () {
  this.addTemplate({
    src: require.resolve('./nuxt-locale-link.vue'),
    fileName: P.join('nuxt-locale-link', 'nuxt-locale-link.vue'),
  })
  pushPlugins(this, {
    src: require.resolve('./plugin'),
    fileName: P.join('nuxt-locale-link', 'plugin.js'),
  })
}
