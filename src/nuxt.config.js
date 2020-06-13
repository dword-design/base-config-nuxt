import P from 'path'
import getPackageName from 'get-package-name'
import bodyParser from 'body-parser'
import babelRegister from '@babel/register'
import dotenvModule from './modules/dotenv'
import eslintModule from './modules/eslint'
import i18nModule from './modules/i18n'
import rawModule from './modules/raw'
import serverMiddlewareModule from './modules/server-middleware'
import projectModule from './modules/project'
import axiosDynamicBaseurlModule from './modules/nuxt-axios-dynamic-baseurl'
import cssModulesModule from './modules/css-modules'
import localeLinkModule from './modules/nuxt-locale-link'

export default {
  buildDir: P.join('dist', 'nuxt'),
  build: {
    babel: {
      babelrc: true,
    },
    quiet: false,
  },
  hooks: {
    'run:before': () => babelRegister(),
  },
  modules: [
    dotenvModule,
    eslintModule,
    cssModulesModule,
    rawModule,
    i18nModule,
    serverMiddlewareModule,
    getPackageName(require.resolve('@nuxtjs/axios')),
    axiosDynamicBaseurlModule,
    getPackageName(require.resolve('nuxt-svg-loader')),
    getPackageName(require.resolve('@nuxtjs/global-components')),
    localeLinkModule,
    projectModule,
  ],
  serverMiddleware: [
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
  ],
}
