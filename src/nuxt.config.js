import packageName from 'depcheck-package-name';
import { createRequire } from 'module';
import viteSvgLoader from 'vite-svg-loader';

import config from './config.js';

const resolver = createRequire(import.meta.url);

const isBasicAuthEnabled =
  process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD;

export default {
  app: {
    head: {
      meta: [
        { content: config.name, hid: 'description', name: 'description' },
        ...(config.webApp
          ? [{ content: 'yes', name: 'apple-mobile-web-app-capable' }]
          : []),
        ...(config.ogImage
          ? [{ content: config.ogImage, hid: 'og:image', name: 'og:image' }]
          : []),
      ],
    },
  },
  devtools: { enabled: true },
  i18n: { bundle: { optimizeTranslationDirective: false } }, // @nuxtjs/i18n only checks global options, not inline options, so it needs to be declared here.
  modules: [
    (options, nuxt) => {
      if (!config.userScalable) {
        const viewportMeta = nuxt.options.app.head.meta.find(
          meta => meta.name === 'viewport',
        );

        viewportMeta.content += ', user-scalable=0';
      }
    },
    [
      packageName`nuxt-basic-authentication-module`,
      { enabled: !!isBasicAuthEnabled },
    ],
    packageName`@nuxt/eslint`,
    [
      packageName`@nuxtjs/stylelint-module`,
      {
        allowEmptyInput: true,
        failOnWarning: true,
        fix: true,
        lintOnStart: false,
      },
    ],
    resolver.resolve('./manually-installed-modules/i18n/index.js'),
  ],
  plugins: [resolver.resolve('./plugins/title.js')],
  router: { options: { linkActiveClass: 'active' } },
  runtimeConfig: {
    public: { name: config.name, title: config.title },
    ...(isBasicAuthEnabled && {
      basicAuth: {
        pairs: {
          [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD,
        },
      },
    }),
  },
  vite: {
    css: { modules: { localsConvention: 'camelCaseOnly' } },
    plugins: [viteSvgLoader()],
    vue: { template: { transformAssetUrls: false } },
  },
  watch: ['config.js'],
};
