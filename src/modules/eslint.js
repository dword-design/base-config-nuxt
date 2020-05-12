import getPackageName from 'get-package-name'
import eslintConfig from '../eslint.config'

export default function () {
  this.extendBuild((config, { isClient }) => {
    if (isClient) {
      config.module.rules.push({
        enforce: 'pre',
        test: /\.(js|vue)$/,
        loader: getPackageName(require.resolve('eslint-loader')),
        include: this.options.srcDir, // avoid linting of with-local-tmp-dir paths
        options: {
          baseConfig: eslintConfig,
          fix: true,
        },
      })
    }
  })
}
