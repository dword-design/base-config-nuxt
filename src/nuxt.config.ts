import { defineNuxtModule } from '@nuxt/kit';
import packageName from 'depcheck-package-name';
import { defineNuxtConfig } from 'nuxt/config';
import ts from 'typescript';

const { config: typescriptConfig } = ts.readConfigFile(
  'tsconfig.json',
  ts.sys.readFile,
);

export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { content: '', name: 'description' },
      ],
    },
  },
  devtools: { enabled: true },
  modules: [
    defineNuxtModule({
      setup: (options, nuxt) => {
        // Set runtime config from app.config
        const appConfig = nuxt.options.appConfig;
        
        nuxt.options.runtimeConfig.public.pageTitle = {
          name: appConfig.name,
          description: appConfig.title,
        };
        
        // Read from app.config at runtime
        nuxt.hook('app:resolve', () => {
          // Set meta tags based on app.config
          if (appConfig.name) {
            const descMeta = nuxt.options.app.head.meta?.find?.(
              meta => meta.name === 'description',
            );
            if (descMeta) {
              descMeta.content = appConfig.name;
            }
          }
          
          if (appConfig.webApp) {
            nuxt.options.app.head.meta?.push({
              content: 'yes',
              name: 'apple-mobile-web-app-capable',
            });
          }
          
          if (appConfig.ogImage) {
            nuxt.options.app.head.meta?.push({
              content: appConfig.ogImage,
              name: 'og:image',
            });
          }
          
          if (!appConfig.userScalable) {
            const viewportMeta = nuxt.options.app.head.meta?.find?.(
              meta => meta.name === 'viewport',
            );

            if (viewportMeta) {
              viewportMeta.content += ', user-scalable=0';
            }
          }
        });
      },
    }),
    [
      packageName`@nuxt/eslint`,
      { checker: { fix: true }, config: { standalone: false } },
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
    packageName`@dword-design/nuxt-page-title`,
  ],
  router: { options: { linkActiveClass: 'active' } },
  typescript: {
    strict: !!typescriptConfig.compilerOptions.strict,
    tsConfig: {
      vueCompilerOptions: {
        // TODO: https://github.com/vuejs/language-tools/pull/5901
        // @ts-expect-error See the link above
        cssModulesLocalsConvention: 'camelCaseOnly',
        strictCssModules: true,
      },
    },
  },
  vite: {
    css: { modules: { localsConvention: 'camelCaseOnly' } },
    vue: { template: { transformAssetUrls: false } },
  },
});
