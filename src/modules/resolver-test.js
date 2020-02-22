import ResolverTestWebpackPlugin from '../resolver-test-webpack-plugin'

export default function () {
  this.extendBuild(config => {
    config.resolve.plugins = [new ResolverTestWebpackPlugin()]
  })
}