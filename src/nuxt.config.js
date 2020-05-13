import P from 'path'
import getPackageName from 'get-package-name'
import dotenvModule from './modules/dotenv'
import babelModule from './modules/babel'
import eslintModule from './modules/eslint'
import rawModule from './modules/raw'
import serverMiddlewareModule from './modules/server-middleware'
import projectModule from './modules/project'

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
    serverMiddlewareModule,
    getPackageName(require.resolve('nuxt-svg-loader')),
    projectModule,
  ],
}
