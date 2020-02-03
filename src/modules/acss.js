import serveStatic from 'serve-static'
import getPackageName from 'get-package-name'

export default function () {
  this.extendBuild(config => {
    config.module.rules
      .find(({ test }) => test.test('.js'))
      .use
      .unshift({
        loader: getPackageName(require.resolve('webpack-atomizer-loader')),
        query: {
          configPath: require.resolve('./config.js'),
        },
      })
  })
  this.options.head.link.push({ rel: 'stylesheet', href: '/acss.css' })
  if (this.options.dev) {
    this.options.head.script.push({ src: 'https://unpkg.com/acss-browser' })
  }
  this.addServerMiddleware({ path: '/acss.css', handler: serveStatic('.acss/index.css') })
}