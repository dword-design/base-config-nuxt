import P from 'path'
import VueLoaderPlugin from 'vue-loader/lib/plugin'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import nodeEnv from 'better-node-env'
import { existsSync } from 'fs-extra'
import eslintConfig from '@dword-design/eslint-config-vue'
import babelConfig from '@dword-design/babel-config-vue'
import nodeSassImporter from '@dword-design/node-sass-importer'

const mode = nodeEnv === 'production' ? 'production' : 'development'
const host = '0.0.0.0'
const port = '8080'
const sourceMap = mode == 'development'
const devtool = mode == 'development'
  // faster for development
  ? 'cheap-module-eval-source-map'
  : false
const doChunk = true
const doMinify = mode == 'production'

export default {
  mode,
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
  devServer: {
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    progress: true,
    host,
    port,
    overlay: { warnings: false, errors: true },
    clientLogLevel: 'warning',
  },
  entry: {
    index: './src/index.js',
  },
  output: {
    path: P.resolve('dist'),
    filename: mode === 'production' ? '[name].[contenthash].js' : '[name].js',
  },
  devtool,
  ...doChunk
    ? {
      optimization: {
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: Infinity,
          //minSize: 0,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: module => {
                // get the name. E.g. node_modules/packageName/not/this/part.js
                // or node_modules/packageName
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]

                // npm package names are URL-safe, but some servers don't like @ symbols
                return `npm.${packageName.replace('@', '')}`
              },
            },
          },
        },
      },
    }
    : {},
  plugins: [
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: P.resolve(__dirname, 'index.html'),
      inject: true,
      ...doMinify
        ? {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
          },
        }
        : {},
    }),
    ...existsSync('favicon.png')
      ? [new FaviconsWebpackPlugin('favicon.png')]
      : [],
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin(),
  ],
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|vue)$/,
        loader: require.resolve('eslint-loader'),
        include: process.cwd(),
        exclude: /node_modules/,
        options: eslintConfig,
      },
      {
        test: /\.svg$/,
        loader: require.resolve('vue-svg-loader'),
        options: { svgo: { plugins: [{ removeViewBox: false }] } },
      },
      {
        test: /\.vue$/,
        loader: require.resolve('vue-loader'),
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: babelConfig,
          },
          {
            loader: require.resolve('linaria/loader'),
            options: { sourceMap, babelOptions: babelConfig },
          },
        ],
      },
      ...(() => {
        const postCssLoader = {
          loader: require.resolve('postcss-loader'),
          options: {
            plugins: [require('postcss-import'), require('postcss-url'), require('autoprefixer')],
            sourceMap,
          },
        }
        return [
          {
            test: /\.css$/,
            use: [require.resolve('vue-style-loader'), require.resolve('css-loader'), postCssLoader],
          },
          {
            test: /\.scss$/,
            use: [
              require.resolve('vue-style-loader'),
              require.resolve('css-loader'),
              postCssLoader,
              {
                loader: require.resolve('sass-loader'),
                options: {
                  sourceMap,
                  sassOptions: {
                    importer: nodeSassImporter,
                  },
                  webpackImporter: false,
                },
              },
            ],
          },
        ]
      })(),
      {
        test: /\.(png|jpe?g|gif|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: require.resolve('url-loader'),
        options: { limit: 10000, name: 'assets/[name].[hash:7].[ext]' },
      },
    ],
  },
}
