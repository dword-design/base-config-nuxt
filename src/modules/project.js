import { forEach, join, keys, map, omit } from '@dword-design/functions'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'
import sequential from 'promise-sequential'
import safeRequire from 'safe-require'

export default async function () {
  const defaultConfig = {
    bodyAttrs: {},
    css: [],
    headAttrs: {},
    hooks: [],
    htmlAttrs: {},
    modules: [],
    name: 'Vue app',
    plugins: [],
    postcssPlugins: {},
    router: {},
    serverMiddleware: [],
    userScalable: true,
  }

  const projectConfig = {
    ...defaultConfig,
    ...safeRequire(P.join(this.options.rootDir, 'nuxt.config.js')),
  }
  this.options.watch.push(P.join(this.options.rootDir, 'nuxt.config.js'))
  this.options.publicRuntimeConfig.name = projectConfig.name
  this.options.publicRuntimeConfig.title = projectConfig.title
  /* istanbul ignore next */
  this.options.head.titleTemplate = function (title) {
    return title
      ? `${title} | ${this.$config.name}`
      : [
          this.$config.name,
          ...(this.$config.title ? [this.$config.title] : []),
        ].join(': ')
  }
  this.options.head.meta.push(
    { charset: 'utf-8' },
    {
      content:
        [
          'width=device-width',
          'initial-scale=1',
          ...(projectConfig.userScalable ? [] : ['user-scalable=0']),
        ] |> join(', '),
      name: 'viewport',
    },
    { content: projectConfig.name, hid: 'description', name: 'description' }
  )
  if (projectConfig.ogImage) {
    this.options.head.meta.push({
      content: projectConfig.ogImage,
      hid: 'og:image',
      name: 'og:image',
    })
  }
  if (projectConfig.webApp) {
    this.options.head.meta.push({
      content: 'yes',
      name: 'apple-mobile-web-app-capable',
    })
  }
  this.options.head.htmlAttrs = projectConfig.htmlAttrs
  this.options.head.headAttrs = projectConfig.headAttrs
  this.options.head.bodyAttrs = projectConfig.bodyAttrs
  this.options.css.push(...projectConfig.css)
  this.options.serverMiddleware.push(...projectConfig.serverMiddleware)
  this.options.build.postcss.plugins = projectConfig.postcssPlugins
  this.options.components = true
  Object.assign(this.options.router, {
    linkActiveClass: 'active',
    routeNameSplitter: '.',
    ...(projectConfig.router |> omit('middleware')),
  })
  this.options.router.middleware = [
    ...this.options.router.middleware,
    ...(projectConfig.router.middleware || []),
  ]
  forEach(projectConfig.hooks, (func, name) => this.nuxt.hook(name, func))
  Object.assign(
    this.options,
    projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys)
  )
  await sequential(
    projectConfig.modules |> map(module => () => this.addModule(module))
  )
  nuxtPushPlugins(this, ...projectConfig.plugins)
}
