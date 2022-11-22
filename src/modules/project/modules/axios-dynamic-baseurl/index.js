import nuxtPushPlugins from 'nuxt-push-plugins'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)

export default function () {
  nuxtPushPlugins(this, _require.resolve('./plugin'))
}
