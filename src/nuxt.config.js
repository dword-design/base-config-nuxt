import dotenv from '@dword-design/dotenv-json-extended'
import getPackageName from 'get-package-name'

dotenv.config()

export default {
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  },
  build: {
    quiet: false,
  },
  modules: [
    require.resolve('./modules/babel'),
    require.resolve('./modules/dotenv'),
    [
      getPackageName(require.resolve('@nuxtjs/eslint-module')),
      { fix: true, failOnWarning: true },
    ],
    [
      getPackageName(require.resolve('@nuxtjs/stylelint-module')),
      { fix: true, failOnWarning: true, allowEmptyInput: true },
    ],
    require.resolve('./modules/css-modules'),
    require.resolve('./modules/raw'),
    require.resolve('./modules/body-parser'),
    require.resolve('./modules/server-middleware'),
    getPackageName(require.resolve('@nuxtjs/axios')),
    require.resolve('./modules/axios-dynamic-baseurl'),
    getPackageName(require.resolve('nuxt-svg-loader')),
    getPackageName(require.resolve('@nuxtjs/global-components')),
    require.resolve('./modules/locale-link'),
    require.resolve('./modules/project'),
    require.resolve('./modules/i18n'),
  ],
}
