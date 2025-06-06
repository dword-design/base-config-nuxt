import packageName from 'depcheck-package-name';
import viteSvgLoader from 'vite-svg-loader';

import config from './config';
import i18nModule from './manually-installed-modules/i18n';
import titlePlugin from './plugins/title';

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
  eslint: { checker: { fix: true }, config: { standalone: false } },
  i18n: { bundle: { optimizeTranslationDirective: false } },
  // @nuxtjs/i18n only checks global options, not inline options, so it needs to be declared here.
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
    i18nModule,
  ],
  plugins: [titlePlugin],
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
  watch: ['config.ts'],
};
