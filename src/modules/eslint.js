import getPackageName from 'get-package-name'
import eslintConfig from '../eslint.config'

export default function () {
  this.extendBuild((config, { isDev, isClient }) => {
    if (isDev && isClient) {
      config.module.rules.push({
        enforce: 'pre',
        test: /\.js$/,
        loader: getPackageName(require.resolve('eslint-loader')),
        include: this.options.srcDir,
        options: {
          baseConfig: eslintConfig,
        },
      })
    }
  })
}