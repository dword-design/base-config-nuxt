import eslintConfig from '@dword-design/eslint-config'
import getPackageName from 'get-package-name'

export default function () {
  this.extendBuild((config, { isDev, isClient }) => {
    if (isDev && isClient) {
      config.module.rules.push({
        enforce: 'pre',
        test: /\.js$/,
        loader: getPackageName(require.resolve('eslint-loader')),
        include: this.options.srcDir,
        options: eslintConfig,
      })
    }
  })
}