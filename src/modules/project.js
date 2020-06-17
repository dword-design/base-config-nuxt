import { keys, omit } from '@dword-design/functions'
import pushPlugins from '@dword-design/nuxt-push-plugins'
import P from 'path'
import safeRequire from 'safe-require'

export default function () {
  const defaultConfig = {
    name: 'Vue app',
    htmlAttrs: {},
    headAttrs: {},
    bodyAttrs: {},
    modules: [],
    plugins: [],
    css: [],
    postcssPlugins: {},
    router: {},
    serverMiddleware: [],
  }
  const projectConfig = {
    ...defaultConfig,
    ...(safeRequire(P.join(this.options.rootDir, 'nuxt.config.js')) || {}),
  }
  this.options.watch.push(P.join(this.options.rootDir, 'nuxt.config.js'))
  if (this.options.server !== false) {
    this.options.server.port = process.env.PORT || 3000
    this.options.server.host = '0.0.0.0'
  }
  this.options.head.titleTemplate = projectConfig.title
    ? `${projectConfig.name} - %s`
    : projectConfig.name
  this.options.head.title = projectConfig.title
  this.options.head.meta.push(
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { hid: 'description', name: 'description', content: projectConfig.name }
  )
  this.options.head.htmlAttrs = projectConfig.htmlAttrs
  this.options.head.headAttrs = projectConfig.headAttrs
  this.options.head.bodyAttrs = projectConfig.bodyAttrs
  this.options.css.push(...projectConfig.css)
  this.options.serverMiddleware.push(...projectConfig.serverMiddleware)
  this.options.build.postcss.plugins = projectConfig.postcssPlugins
  Object.assign(this.options.router, {
    routeNameSplitter: '.',
    linkActiveClass: 'active',
    ...projectConfig.router,
  })
  Object.assign(
    this.options,
    projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys)
  )
  projectConfig.modules.forEach(module => this.addModule(module))
  pushPlugins(this, ...projectConfig.plugins)
}
