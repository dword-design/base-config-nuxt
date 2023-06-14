import { transform } from '@babel/core'
import { babel as rollupPluginBabel } from '@rollup/plugin-babel'
import { parseVueRequest } from '@vitejs/plugin-vue'
import { parse } from '@vue/compiler-sfc'
import packageName from 'depcheck-package-name'
import vueSfcDescriptorToString from 'vue-sfc-descriptor-to-string'

import config from './config.js'
// import expressModule from './modules/express/index.js'
import i18nModule from './modules/i18n/index.js'
import localeLinkModule from './modules/locale-link/index.js'
import svgModule from './modules/svg.js'

const isBasicAuthEnabled =
  process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD

export default {
  app: {
    head: {
      meta: [
        {
          content: config.name,
          hid: 'description',
          name: 'description',
        },
        ...(config.webApp
          ? [
              {
                content: 'yes',
                name: 'apple-mobile-web-app-capable',
              },
            ]
          : []),
        ...(config.ogImage
          ? [
              {
                content: config.ogImage,
                hid: 'og:image',
                name: 'og:image',
              },
            ]
          : []),
      ],
    },
  },
  modules: [
    (otpoins, nuxt) => {
      if (!config.userScalable) {
        const viewportMeta = nuxt.options.app.head.meta.find(
          meta => meta.name === 'viewport',
        )
        viewportMeta.content += ', user-scalable=0'
      }
    },
    [
      packageName`nuxt-basic-authentication-module`,
      { enabled: !!isBasicAuthEnabled },
    ],
    [
      packageName`@nuxtjs/eslint-module`,
      { cache: false, failOnWarning: true, fix: true, lintOnStart: false },
    ],
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
    // expressModule,
    svgModule,
    localeLinkModule,
  ],
  nitro: {
    rollupConfig: {
      plugins: [rollupPluginBabel({ babelHelpers: 'bundled' })],
    },
  },
  router: {
    options: {
      linkActiveClass: 'active',
    },
  },
  runtimeConfig: {
    public: {
      name: config.name,
      title: config.title,
    },
    ...(isBasicAuthEnabled && {
      basicAuth: {
        pairs: {
          [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD,
        },
      },
    }),
  },
  vite: {
    plugins: [
      {
        enforce: 'pre',
        transform: async (code, id) => {
          const query = parseVueRequest(id)
          if (
            query.filename.endsWith('.vue') &&
            !query.filename.split('/').includes('node_modules')
          ) {
            const sfc = parse(code)
            for (const section of ['scriptSetup', 'script']) {
              if (
                sfc.descriptor[section] &&
                sfc.descriptor[section].lang === undefined
              ) {
                sfc.descriptor[section].content = await transform(
                  sfc.descriptor[section].content,
                  {
                    plugins: [
                      [
                        '@babel/plugin-proposal-pipeline-operator',
                        { proposal: 'fsharp' },
                      ],
                    ],
                  },
                ).code
              }
            }

            return vueSfcDescriptorToString(sfc.descriptor)
          }

          return code
        },
      },
    ],
    vue: {
      template: {
        transformAssetUrls: {
          includeAbsolute: false,
        },
      },
    },
  },
  watch: ['config.js'],
}
