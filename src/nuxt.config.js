import eslintConfig from '@dword-design/eslint-config'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import { existsSync } from 'fs-extra'
import P from 'path'
import nodeSassImporter from '@dword-design/node-sass-importer'
import ResolverTestWebpackPlugin from './resolver-test-webpack-plugin'
import getPackageName from 'get-package-name'
import safeRequire from 'safe-require'

const projectConfig = safeRequire(P.join(process.cwd(), 'src', 'index.js'))?.default ?? {}
const title = projectConfig.title ?? 'Vue app'

export default {
  srcDir: 'src',
  head: {
    title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: title },
    ],
    link: [
      { rel: 'stylesheet', href: '/acss.css' },
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
        .unshift({
          loader: require.resolve('webpack-atomizer-loader'),
          query: {
            configPath: require.resolve('./acss.config.js'),
          },
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
  ...projectConfig,
  modules: [
    getPackageName(require.resolve('nuxt-svg-loader')),
    ...projectConfig.modules ?? [],
  ],
}