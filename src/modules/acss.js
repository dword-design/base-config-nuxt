import serveStatic from 'serve-static'

export default function () {
  this.extendBuild(config => {
    config.module.rules
      .find(({ test }) => test.test('.js'))
      .use
      .unshift({
        loader: require.resolve('webpack-atomizer-loader'),
        query: {
          configPath: require.resolve('./config.js'),
        },
      })
  })
  this.options.head.link.push({ rel: 'stylesheet', href: '/acss.css' })
  this.addServerMiddleware({ path: '/acss.css', handler: serveStatic('.acss/index.css') })
}