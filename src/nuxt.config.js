import packageName from 'depcheck-package-name';
import { createRequire } from 'module';

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
    resolver.resolve('./modules/i18n/index.js'),
    resolver.resolve('./modules/locale-link/index.js'),
    resolver.resolve('./modules/svg.js'),
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
  vite: { vue: { template: { transformAssetUrls: false } } },
  watch: ['config.js'],
};
