import { join, keys, omit } from '@dword-design/functions'
import pushPlugins from '@dword-design/nuxt-push-plugins'
import P from 'path'
import safeRequire from 'safe-require'

export default function () {
  const defaultConfig = {
    bodyAttrs: {},
    css: [],
    headAttrs: {},
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
  this.options.head.titleTemplate = projectConfig.title
    ? `${projectConfig.name} - %s`
    : projectConfig.name
  this.options.head.title = projectConfig.title
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
  this.options.head.htmlAttrs = projectConfig.htmlAttrs
  this.options.head.headAttrs = projectConfig.headAttrs
  this.options.head.bodyAttrs = projectConfig.bodyAttrs
  this.options.css.push(...projectConfig.css)
  this.options.serverMiddleware.push(...projectConfig.serverMiddleware)
  this.options.build.postcss.plugins = projectConfig.postcssPlugins
  Object.assign(this.options.router, {
    linkActiveClass: 'active',
    routeNameSplitter: '.',
    ...(projectConfig.router |> omit('middleware')),
  })
  this.options.router.middleware = [
    ...this.options.router.middleware,
    ...projectConfig.router.middleware || [],
  ]
  Object.assign(
    this.options,
    projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys)
  )
  projectConfig.modules.forEach(module => this.addModule(module))
  pushPlugins(this, ...projectConfig.plugins)
}
