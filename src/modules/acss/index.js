import serveStatic from 'serve-static'
import getPackageName from 'get-package-name'
import stringifyObject from 'stringify-object'
import autoprefixer from 'autoprefixer'
import config from './config'
import P from 'path'

export default function () {
  this.extendBuild(config => {
    config.module.rules
      .find(({ test }) => test.test('.js'))
      .use
      .unshift({
        loader: getPackageName(require.resolve('webpack-atomizer-loader')),
        query: {
          postcssPlugins: [autoprefixer],
          minimize: true,
          configPath: require.resolve('./config.js'),
        },
      })
  })
  this.options.head.link.push({ rel: 'stylesheet', href: '/acss.css' })
  if (this.options.dev) {
    this.options.serverMiddleware.push(
      {
        path: '/register-acss-browser-config.js',
        handler: (req, res) => res.end(`window.acssConfig = ${stringifyObject(config.configs, { indent: '  ' })};`),
      },
      {
        path: '/acss-browser',
        handler: serveStatic(require.resolve('acss-browser/acss-browser.min.js')),
      },
    )
    this.options.head.script.push(
      { src: '/register-acss-browser-config.js' },
      { src: '/acss-browser' },
    )
  }
  this.options.serverMiddleware.push({
    path: '/acss.css',
    handler: serveStatic(P.join('dist', 'acss.css')),
  })
}