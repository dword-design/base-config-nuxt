import getPackageName from 'get-package-name'

export default function () {
  this.extendBuild(config => {
    config.module.rules.push({
      test: /\.(txt|html)$/,
      loader: getPackageName(require.resolve('raw-loader')),
      exclude: /node_modules/,
    })
  })
}
