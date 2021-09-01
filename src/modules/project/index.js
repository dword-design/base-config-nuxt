import { keys, map, omit } from '@dword-design/functions'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'
import sequential from 'promise-sequential'
import safeRequire from 'safe-require'

/* istanbul ignore next */
const head = function () {
  const _require = require

  const projectConfig = _require('./project/project-config').default

  const i18nHead = this.$nuxtI18nHead?.({ addSeoAttributes: true }) || {
    htmlAttrs: {},
    link: [],
    meta: [],
  }

  return {
    bodyAttrs: projectConfig.bodyAttrs,
    headAttrs: projectConfig.headAttrs,
    htmlAttrs: {
      ...projectConfig.htmlAttrs,
      ...i18nHead.htmlAttrs,
    },
    link: [...(projectConfig.head.link || []), ...(i18nHead.link || [])],
    meta: [
      { charset: 'utf-8' },
      {
        content: [
          'width=device-width',
          'initial-scale=1',
          ...(projectConfig.userScalable ? [] : ['user-scalable=0']),
        ].join(', '),
        name: 'viewport',
      },
      {
        content: projectConfig.name,
        hid: 'description',
        name: 'description',
      },
      ...(projectConfig.ogImage
        ? [
            {
              content: projectConfig.ogImage,
              hid: 'og:image',
              name: 'og:image',
            },
          ]
        : []),
      ...(projectConfig.webApp
        ? [
            {
              content: 'yes',
              name: 'apple-mobile-web-app-capable',
            },
          ]
        : []),
      ...(i18nHead.meta || []),
    ],
    titleTemplate(title) {
      return title
        ? `${title} | ${this.$config.name}`
        : [
            this.$config.name,
            ...(this.$config.title ? [this.$config.title] : []),
          ].join(': ')
    },
  }
}

export default async function () {
  const defaultConfig = {
    bodyAttrs: {},
    css: [],
    head: {},
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
  this.options.publicRuntimeConfig.name = projectConfig.name
  this.options.publicRuntimeConfig.title = projectConfig.title
  this.options.head = head
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
  Object.assign(
    this.options,
    projectConfig |> omit({ ...defaultConfig, ...this.options } |> keys)
  )
  await sequential(
    projectConfig.modules |> map(module => () => this.addModule(module))
  )
  this.addTemplate({
    fileName: P.join('project', 'project-config.js'),
    options: projectConfig,
    src: require.resolve('./project-config.js.template'),
  })
  nuxtPushPlugins(this, ...projectConfig.plugins)
}
