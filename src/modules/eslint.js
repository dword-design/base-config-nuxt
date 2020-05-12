import getPackageName from 'get-package-name'
import eslintConfig from '../eslint.config'

export default function () {
  this.extendBuild((config, { isClient }) => {
    if (isClient) {
      config.module.rules.push({
        enforce: 'pre',
        test: /\.(js|vue)$/,
        loader: getPackageName(require.resolve('eslint-loader')),
        exclude: /(node_modules)/,
        options: {
          baseConfig: eslintConfig,
          ignorePath: '.gitignore',
          fix: true,
        },
      })
    }
  })
}
