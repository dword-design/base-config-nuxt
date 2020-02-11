import eslintConfig from '@dword-design/eslint-config'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import { existsSync } from 'fs-extra'
import P from 'path'
import nodeSassImporter from '@dword-design/node-sass-importer'
import ResolverTestWebpackPlugin from './resolver-test-webpack-plugin'
import getPackageName from 'get-package-name'
import projectConfig from './project.config'
import acssModule from './modules/acss'
import rootDir from './root-dir'

export default {
  rootDir,
  srcDir: 'src',
  buildDir: P.join('dist', 'nuxt'),
  head: {
    title: projectConfig.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: projectConfig.title },
    ],
  },
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
    extend: (config, { isDev, isClient }) => {

      config.resolve.plugins = [new ResolverTestWebpackPlugin()]
      
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.js$/,
          loader: getPackageName(require.resolve('eslint-loader')),
          include: P.join(rootDir, 'src'),
          options: eslintConfig,
        })
      }

      if (existsSync(P.join(rootDir, 'src', 'favicon.png'))) {
        config.plugins.push(new FaviconsWebpackPlugin(P.resolve(rootDir, 'src', 'favicon.png')))
      }
    },
  },
  svgLoader: {
    svgoConfig: {
      plugins: [
        { removeViewBox: false },
      ],
    },
  },
  ...projectConfig,
  modules: [
    getPackageName(require.resolve('nuxt-svg-loader')),
    acssModule,
    ...projectConfig.modules,
  ],
}