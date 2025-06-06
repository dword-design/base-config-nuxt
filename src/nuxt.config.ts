import packageName from 'depcheck-package-name';
import viteSvgLoader from 'vite-svg-loader';

import config from './config';
import i18nModule from './manually-installed-modules/i18n';

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
      titleTemplate: pageTitle =>
        pageTitle
          ? `${pageTitle} | ${config.name}`
          : `${config.name}${config.title ? `: ${config.title}` : ''}`,
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
  router: { options: { linkActiveClass: 'active' } },
  runtimeConfig: {
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
