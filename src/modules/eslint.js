import getPackageName from 'get-package-name'

export default function () {
  this.extendBuild((config, { isClient }) => {
    if (isClient) {
      config.module.rules.push({
        enforce: 'pre',
        test: /\.(js|vue)$/,
        loader: getPackageName(require.resolve('eslint-loader')),
        exclude: /(node_modules)/,
        options: {
          ignorePath: '.gitignore',
          failOnWarning: true,
          fix: true,
        },
      })
    }
  })
}
