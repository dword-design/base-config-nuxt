import getPackageName from 'get-package-name'

export default function () {
  this.extendBuild(config => {
    config.module.rules.push({
      exclude: /node_modules/,
      loader: getPackageName(require.resolve('raw-loader')),
      test: /\.(txt|html)$/,
    })
  })
}
