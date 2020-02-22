import P from 'path'
import nodeSassImporter from '@dword-design/node-sass-importer'
import resolverTestModule from './modules/resolver-test'
import eslintModule from './modules/eslint'
import faviconModule from './modules/favicon'
import projectModule from './modules/project'

export default {
  srcDir: 'src',
  buildDir: P.join('dist', 'nuxt'),
  build: {
    babel: {
      configFile: require.resolve('@dword-design/babel-config'),
    },
    loaders: {
      scss: {
        sassOptions: {
          importer: nodeSassImporter,
        },
        webpackImporter: false,
      },
    },
  },
  modules: [
    resolverTestModule,
    eslintModule,
    faviconModule,
    projectModule,
  ],
}
