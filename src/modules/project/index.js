import babelConfig from '@dword-design/babel-config'
import { join, keys, map, omit } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import jiti from 'jiti'
import { createRequire } from 'module'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'
import sequential from 'promise-sequential'

import axiosDynamicBaseurlModule from './modules/axios-dynamic-baseurl/index.js'
import babelModule from './modules/babel.js'
import bodyParserModule from './modules/body-parser.js'
import cssModulesModule from './modules/css-modules.js'
import dotenvModule from './modules/dotenv.js'
import i18nModule from './modules/i18n/index.js'
import localeLinkModule from './modules/locale-link/index.js'
import rawModule from './modules/raw.js'
import serverMiddlewareModule from './modules/server-middleware/index.js'

const _require = createRequire(import.meta.url)

export default async function () {
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
    serverMiddleware: [],
    userScalable: true,
  }
  let localConfig
  try {
    const jitiInstance = jiti(this.options.rootDir, {
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
  this.options.head.link.push(...(projectConfig.head.link || []))
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
  Object.assign(
    this.options,
    projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys)
  )
  await sequential(
    [
      [
        packageName`nuxt-basic-auth-module`,
        {
          enabled:
            process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD,
          name: process.env.BASIC_AUTH_USER,
          pass: process.env.BASIC_AUTH_PASSWORD,
        },
      ],
      babelModule,
      dotenvModule,
      [packageName`@nuxtjs/eslint-module`, { failOnWarning: true, fix: true }],
      [
        packageName`@nuxtjs/stylelint-module`,
        { allowEmptyInput: true, failOnWarning: true, fix: true },
      ],
      cssModulesModule,
      rawModule,
      i18nModule,
      bodyParserModule,
      [
        serverMiddlewareModule,
        { getExpressInstance: projectConfig.getExpressInstance },
      ],
      packageName`@nuxtjs/axios`,
      axiosDynamicBaseurlModule,
      packageName`nuxt-svg-loader`,
      localeLinkModule,
      ...projectConfig.modules,
    ] |> map(module => () => this.addModule(module))
  )
  this.addTemplate({
    fileName: P.join('project', 'project-config.js'),
    options: projectConfig,
    src: _require.resolve('./project-config.js.template'),
  })
  nuxtPushPlugins(this, ...projectConfig.plugins)
}
