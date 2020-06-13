import pushPlugins from '@dword-design/nuxt-push-plugins'

export default function () {
  pushPlugins(this, require.resolve('./plugin'))
}
