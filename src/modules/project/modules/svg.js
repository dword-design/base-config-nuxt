import svgLoader from 'vite-svg-loader'

export default (moduleOptions, nuxt) => {
  nuxt.options.vite.plugins = nuxt.options.vite.plugins || []
  nuxt.options.vite.plugins.push(svgLoader())
}
