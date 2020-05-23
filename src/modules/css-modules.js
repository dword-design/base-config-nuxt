export default function () {
  this.options.build.loaders.cssModules.modules.localIdentName = this.options
    .dev
    ? '[name]__[local]'
    : '[hash:base64]'
  this.options.build.loaders.cssModules.localsConvention = 'camelCase'
}
