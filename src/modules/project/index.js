import babelConfig from '@dword-design/babel-config'
import { join, keys, omit } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import jiti from 'jiti'
import { createRequire } from 'module'
import P from 'path'
import { addPlugin, installModule, addTemplate } from '@nuxt/kit'

import dotenvModule from './modules/dotenv.js'
import i18nModule from './modules/i18n/index.js'
import serverMiddlewareModule from './modules/server-middleware/index.js'
import svgModule from './modules/svg.js'

const _require = createRequire(import.meta.url)

export default async function (moduleOptions, nuxt) {
  const defaultConfig = {
    bodyAttrs: {},
    css: [_require.resolve('./style.css')],
    head: {},
    headAttrs: {},
    htmlAttrs: {},
    modules: [],
    name: 'Vue app',
    plugins: [],
    router: {},
    userScalable: true,
  }
  let localConfig
  try {
    const jitiInstance = jiti(nuxt.options.rootDir, {
      esmResolve: true,
      interopDefault: true,
      transformOptions: {
        babel: babelConfig,
      },
    })
    localConfig = jitiInstance('./nuxt.config.js')
  } catch (error) {
    if (error.message.startsWith("Cannot find module './nuxt.config.js'\n")) {
      localConfig = {}
    } else {
      throw error
    }
  }

  const projectConfig = {
    ...defaultConfig,
    ...localConfig,
    css: [...defaultConfig.css, ...(localConfig.css || [])],
  }
  //this.options.watch.push(P.join(this.options.rootDir, 'nuxt.config.js'))
  nuxt.options.runtimeConfig.public.name = projectConfig.name
  nuxt.options.runtimeConfig.public.title = projectConfig.title
  nuxt.options.app.head.link.push(...(projectConfig.head.link || []))
  nuxt.options.app.head.meta.push(
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
    nuxt.options.app.head.meta.push({
      content: projectConfig.ogImage,
      hid: 'og:image',
      name: 'og:image',
    })
  }
  if (projectConfig.webApp) {
    nuxt.options.app.head.meta.push({
      content: 'yes',
      name: 'apple-mobile-web-app-capable',
    })
  }
  nuxt.options.app.head.htmlAttrs = projectConfig.htmlAttrs
  nuxt.options.app.head.headAttrs = projectConfig.headAttrs
  nuxt.options.app.head.bodyAttrs = projectConfig.bodyAttrs
  nuxt.options.css.push(...projectConfig.css)
  Object.assign(nuxt.options.router, {
    linkActiveClass: 'active',
    routeNameSplitter: '.',
  })
  Object.assign(
    nuxt.options,
    projectConfig |> omit({ ...defaultConfig, ...nuxt.options } |> keys)
  )
  const modules = [
    [
      packageName`nuxt-basic-auth`,
      {
        enabled:
          process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD,
        username: process.env.BASIC_AUTH_USER,
        password: process.env.BASIC_AUTH_PASSWORD,
      },
    ],
    dotenvModule,
    /*[
      packageName`@nuxtjs/stylelint-module`,
      { allowEmptyInput: true, failOnWarning: true, fix: true },
    ],*/
    i18nModule,
    //[serverMiddlewareModule, { getExpress: projectConfig.getExpress }],
    svgModule,
    ...projectConfig.modules,
  ]
  for (let module of modules) {
    module = [].concat(module)
    await installModule(module[0], module[1])
  }
  addTemplate({
    fileName: P.join('project', 'project-config.js'),
    options: projectConfig,
    src: _require.resolve('./project-config.js.template'),
  })
  for (const plugin of projectConfig.plugins) {
    addPlugin(plugin, { append: true })
  }
}
