import P from 'path'
import dotenvModule from './modules/dotenv'
import babelModule from './modules/babel'
import eslintModule from './modules/eslint'
import projectModule from './modules/project'

export default {
  srcDir: 'src',
  buildDir: P.join('dist', 'nuxt'),
  build: {
    quiet: false,
  },
  modules: [dotenvModule, babelModule, eslintModule, projectModule],
}
