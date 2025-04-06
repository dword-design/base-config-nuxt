import {
  addPlugin,
  createResolver,
  defineNuxtModule,
  installModule,
} from '@nuxt/kit';
import packageName from 'depcheck-package-name';
import { globby } from 'globby';
import P from 'path';

const resolver = createResolver(import.meta.url);

export default defineNuxtModule({
  setup: async (options, nuxt) => {
    const locales = (
      await globby('*.json', { cwd: P.join(nuxt.options.srcDir, 'i18n') })
    ).map(filename => P.basename(filename, '.json'));

    const defaultLocale = locales.includes('en') ? 'en' : locales[0];

    if (locales.length === 0) {
      return;
    }

    const nuxtI18nOptions = {
      defaultLocale,
      detectBrowserLanguage:
        locales.length === 1
          ? false
          : {
              fallbackLocale: defaultLocale,
              redirectOn: 'no prefix',
              useCookie: false,
            },
      langDir: '.',
      lazy: true,
      locales: locales.map(locale => ({
        code: locale,
        file: `${locale}.json`,
        language: locale,
      })),
      strategy: `${locales.length === 1 ? 'no_' : ''}prefix`,
      ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    };

    /**
     * Artificially add the module already so that @nuxtjs/i18n will find it when merging layers
     * (see applyLayerOptions calling getLayerI18n)
     */
    nuxt.options._layers[0].config.modules =
      nuxt.options._layers[0].config.modules || [];

    nuxt.options._layers[0].config.modules.push(['@nuxtjs/i18n', nuxtI18nOptions]);
    await installModule(packageName`@nuxtjs/i18n`, nuxtI18nOptions);
    addPlugin(resolver.resolve('./plugin.js'), { append: true });
  },
});
