import P from 'path'
import babelModule from './modules/babel'
import sassImporterModule from './modules/sass-importer'
import resolverTestModule from './modules/resolver-test'
import eslintModule from './modules/eslint'
import projectModule from './modules/project'

export default {
  srcDir: 'src',
  buildDir: P.join('dist', 'nuxt'),
  build: {
    quiet: false,
  },
  modules: [
    babelModule,
    sassImporterModule,
    resolverTestModule,
    eslintModule,
    projectModule,
  ],
}
