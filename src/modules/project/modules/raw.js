import packageName from 'depcheck-package-name'

export default function () {
  this.extendBuild(config => {
    config.module.rules.push({
      exclude: /node_modules/,
      loader: packageName`raw-loader`,
      test: /\.(txt|html)$/,
    })
  })
}
