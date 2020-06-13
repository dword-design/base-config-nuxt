import P from 'path'
import getPackageName from 'get-package-name'

export default {
  buildDir: P.join('dist', 'nuxt'),
  build: {
    quiet: false,
  },
  modules: [
    require.resolve('./modules/babel'),
    require.resolve('./modules/dotenv'),
    require.resolve('./modules/eslint'),
    require.resolve('./modules/css-modules'),
    require.resolve('./modules/raw'),
    require.resolve('./modules/i18n'),
    require.resolve('./modules/body-parser'),
    require.resolve('./modules/server-middleware'),
    getPackageName(require.resolve('@nuxtjs/axios')),
    require.resolve('./modules/axios-dynamic-baseurl'),
    getPackageName(require.resolve('nuxt-svg-loader')),
    getPackageName(require.resolve('@nuxtjs/global-components')),
    require.resolve('./modules/locale-link'),
    require.resolve('./modules/project'),
  ],
}
