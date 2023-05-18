import { omit } from '@dword-design/functions'
import { addPlugin, addTemplate, installModule } from '@nuxt/kit'
import packageName from 'depcheck-package-name'
import { createRequire } from 'module'
import P from 'path'

import expressModule from './modules/express/index.js'
import i18nModule from './modules/i18n/index.js'
import localeLinkModule from './modules/locale-link/index.js'
import svgModule from './modules/svg.js'

const _require = createRequire(import.meta.url)

export default async (options, nuxt) => {
  const defaultConfig = {
    bodyAttrs: {},
    css: [],
    head: {},
    headAttrs: {},
    htmlAttrs: {},
    modules: [],
    name: 'Vue app',
    plugins: [],
    router: {},
    userScalable: true,
  }

  const projectConfig = {
    ...defaultConfig,
    ...options,
    css: [...defaultConfig.css, ...(options.css || [])],
  }
  nuxt.options.watch.push('config.js')
  nuxt.options.runtimeConfig.public.name = projectConfig.name
  nuxt.options.runtimeConfig.public.title = projectConfig.title
  if (process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD) {
    nuxt.options.runtimeConfig.basicAuth = {
      pairs: {
        [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD,
      },
    }
  }
  nuxt.options.app.head.link.push(...(projectConfig.head.link || []))
  nuxt.options.app.head.meta.push({
    content: projectConfig.name,
    hid: 'description',
    name: 'description',
  })
  if (!projectConfig.userScalable) {
    const viewportMeta = nuxt.options.app.head.meta.find(
      meta => meta.name === 'viewport',
    )
    viewportMeta.content += ', user-scalable=0'
  }
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
  nuxt.options.app.head.bodyAttrs = projectConfig.bodyAttrs
  nuxt.options.css.push(...projectConfig.css)
  Object.assign(nuxt.options.router.options, {
    linkActiveClass: 'active',
    routeNameSplitter: '.',
    ...projectConfig.router,
  })
  Object.assign(
    nuxt.options,
    omit(Object.keys({ ...defaultConfig, ...nuxt.options }))(projectConfig),
  )

  const modules = [
    [
      packageName`nuxt-basic-authentication-module`,
      {
        enabled: nuxt.options.runtimeConfig.basicAuth !== undefined,
      },
    ],
    [packageName`@nuxtjs/eslint-module`, { failOnWarning: true, fix: true, lintOnStart: false, cache: false }],
    [
      packageName`@nuxtjs/stylelint-module`,
      {
        allowEmptyInput: true,
        failOnWarning: true,
        fix: true,
        lintOnStart: false,
      },
    ],
    i18nModule,
    expressModule,
    svgModule,
    localeLinkModule,
    ...(projectConfig.modules || []),
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
