import P from 'path'
import getPackageName from 'get-package-name'
import dotenvModule from './modules/dotenv'
import babelModule from './modules/babel'
import eslintModule from './modules/eslint'
import i18nModule from './modules/i18n'
import rawModule from './modules/raw'
import serverMiddlewareModule from './modules/server-middleware'
import projectModule from './modules/project'
import axiosDynamicBaseurlModule from './modules/nuxt-axios-dynamic-baseurl'

export default {
  buildDir: P.join('dist', 'nuxt'),
  build: {
    quiet: false,
  },
  modules: [
    dotenvModule,
    babelModule,
    eslintModule,
    rawModule,
    i18nModule,
    serverMiddlewareModule,
    getPackageName(require.resolve('@nuxtjs/axios')),
    axiosDynamicBaseurlModule,
    getPackageName(require.resolve('nuxt-svg-loader')),
    getPackageName(require.resolve('@nuxtjs/global-components')),
    projectModule,
  ],
}
