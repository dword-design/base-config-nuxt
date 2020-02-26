import babelConfig from '@dword-design/babel-config'
import babelRegister from '@babel/register'
import nodeEnv from 'better-node-env'
import safeRequire from 'safe-require'
import P from 'path'
import { omit, keys } from '@dword-design/functions'

export default function () {

  if (nodeEnv !== 'test') {
    babelRegister(babelConfig)
  }
  
  const defaultConfig = {
    title: 'Vue app',
    htmlAttrs: {},
    headAttrs: {},
    bodyAttrs: {},
    modules: [],
    plugins: [],
    css: [],
    router: {},
    serverMiddleware: [],
  }

  const projectConfig = {
    ...defaultConfig,
    ...safeRequire(P.join(this.options.rootDir, this.options.dev ? 'src' : 'dist', 'index.js')) ?? {},
  }

  this.options.head.title = projectConfig.title
  this.options.head.meta.push(
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { hid: 'description', name: 'description', content: projectConfig.title },
  )
  this.options.head.htmlAttrs = projectConfig.htmlAttrs
  this.options.head.headAttrs = projectConfig.headAttrs
  this.options.head.bodyAttrs = projectConfig.bodyAttrs
  this.options.css.push(...projectConfig.css)
  this.options.serverMiddleware.push(...projectConfig.serverMiddleware)
  
  Object.assign(this.options.router, projectConfig.router)
  Object.assign(this.options, projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys))
  
  projectConfig.modules.forEach(module => this.addModule(module))
  projectConfig.plugins.forEach(plugin => this.addPlugin(plugin))
}