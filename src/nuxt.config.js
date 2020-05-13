import P from 'path'
import dotenvModule from './modules/dotenv'
import babelModule from './modules/babel'
import eslintModule from './modules/eslint'
import apiModule from './modules/api'
import projectModule from './modules/project'

export default {
  buildDir: P.join('dist', 'nuxt'),
  build: {
    quiet: false,
  },
  modules: [dotenvModule, babelModule, eslintModule, apiModule, projectModule],
}
