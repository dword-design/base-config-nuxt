import eslintConfig from '@dword-design/eslint-config'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import { existsSync } from 'fs-extra'
import P from 'path'
import babelConfig from '@dword-design/babel-config'
import nodeSassImporter from '@dword-design/node-sass-importer'
import ResolverTestWebpackPlugin from './resolver-test-webpack-plugin'
import getPackageName from 'get-package-name'

const { baseConfig: rawConfig } = require(P.resolve('package.json'))
const { mode = 'universal', port = 3000 } = (typeof rawConfig === 'string' ? {} : rawConfig) ?? {}

export default {
  mode,
  server: {
    port,
  },
  srcDir: 'src',
  head: {
    title: 'Vue app',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Vue app' },
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
          exclude: /node_modules/,
          options: eslintConfig,
        })
      }
      config.module.rules
        .find(({ test }) => test.test('.js'))
        .use
        .push({
          loader: require.resolve('linaria/loader'),
          options: { babelOptions: babelConfig },
        })
      if (existsSync(P.join('src', 'favicon.png'))) {
        config.plugins.push(new FaviconsWebpackPlugin(P.resolve('src', 'favicon.png')))
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
  ...existsSync(P.join('src', 'index.js'))
    ? { plugins: ['index.js'] }
    : {},
  modules: [getPackageName(require.resolve('nuxt-svg-loader'))],
}