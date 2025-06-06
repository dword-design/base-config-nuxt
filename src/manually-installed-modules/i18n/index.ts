import P from 'node:path';

import {
  addPlugin,
  createResolver,
  defineNuxtModule,
  installModule,
} from '@nuxt/kit';
import packageName from 'depcheck-package-name';
import { globby } from 'globby';

const resolver = createResolver(import.meta.url);

export default defineNuxtModule({
  setup: async (options, nuxt) => {
    const filenames = await globby('*.json', {
      cwd: P.join(nuxt.options.srcDir, 'i18n'),
    });

    const locales = filenames.map(filename => P.basename(filename, '.json'));
    const defaultLocale = locales.includes('en') ? 'en' : locales[0];

    if (locales.length === 0) {
      return;
    }

    /**
     * @nuxtjs/i18n won't be able to merge the locales because it will not be in the layer configs
     * since we install it via @nuxtjs/i18n (see applyLayerOptions calling getLayerI18n).
     * So we add the locales via the hook.
     */
    nuxt.hook('i18n:registerModule', register =>
      register({
        langDir: P.join(nuxt.options.srcDir, 'i18n'), // Set to '.' when passed directly as inline module options
        locales: locales.map(locale => ({
          code: locale,
          file: `${locale}.json`,
          language: locale,
        })),
      }),
    );

    await installModule(packageName`@nuxtjs/i18n`, {
      defaultLocale,
      detectBrowserLanguage:
        locales.length === 1
          ? false
          : {
              fallbackLocale: defaultLocale,
              redirectOn: 'no prefix',
              useCookie: false,
            },
      lazy: true,
      strategy: `${locales.length === 1 ? 'no_' : ''}prefix`,
      ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    });

    addPlugin(resolver.resolve('./plugin.js'), { append: true });
    await installModule(resolver.resolve('../locale-link/index.ts'));
  },
});
