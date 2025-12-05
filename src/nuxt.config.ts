import { defineNuxtModule } from '@nuxt/kit';
import packageName from 'depcheck-package-name';
import ts from 'typescript';

import config from './config';

const { config: typescriptConfig } = ts.readConfigFile(
  'tsconfig.json',
  ts.sys.readFile,
);

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
  modules: [
    defineNuxtModule({
      setup: (options, nuxt) => {
        if (!config.userScalable) {
          const viewportMeta = nuxt.options.app.head.meta?.find?.(
            meta => meta.name === 'viewport',
          );

          if (viewportMeta) {
            viewportMeta.content += ', user-scalable=0';
          }
        }
      },
    }),
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
    [
      packageName`@dword-design/nuxt-page-title`,
      { description: config.title, name: config.name },
    ],
  ],
  router: { options: { linkActiveClass: 'active' } },
  typescript: { strict: !!typescriptConfig.compilerOptions.strict },
  vite: {
    css: { modules: { localsConvention: 'camelCaseOnly' } },
    vue: { template: { transformAssetUrls: false } },
  },
};
