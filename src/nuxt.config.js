import dotenv from '@dword-design/dotenv-json-extended'
import packageName from 'depcheck-package-name'
import esm from 'esm'

dotenv.config()

export default {
  createRequire: () => esm(module),
  modules: [
    require.resolve('./modules/babel'),
    require.resolve('./modules/dotenv'),
    [packageName`@nuxtjs/eslint-module`, { failOnWarning: true, fix: true }],
    [
      packageName`@nuxtjs/stylelint-module`,
      { allowEmptyInput: true, failOnWarning: true, fix: true },
    ],
    require.resolve('./modules/css-modules'),
    require.resolve('./modules/raw'),
    require.resolve('./modules/i18n'),
    require.resolve('./modules/body-parser'),
    require.resolve('./modules/server-middleware'),
    packageName`@nuxtjs/axios`,
    require.resolve('./modules/axios-dynamic-baseurl'),
    packageName`nuxt-svg-loader`,
    require.resolve('./modules/locale-link'),
    require.resolve('./modules/project'),
  ],
  server: {
    port: process.env.PORT || 3000,
  },
}
