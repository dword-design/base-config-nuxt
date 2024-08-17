import { addPlugin, createResolver, installModule } from '@nuxt/kit';
import packageName from 'depcheck-package-name';
import { globby } from 'globby';
import P from 'path';

const resolver = createResolver(import.meta.url);

export default async (options, nuxt) => {
  const locales = (
    await globby('*.json', { cwd: P.join(nuxt.options.srcDir, 'i18n') })
  ).map(filename => P.basename(filename, '.json'));

  const defaultLocale = locales.includes('en') ? 'en' : locales[0];

  if (locales.length === 0) {
    return;
  }

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
    langDir: 'i18n',
    lazy: true,
    locales: locales.map(locale => ({
      code: locale,
      file: `${locale}.json`,
      iso: locale,
    })),
    strategy: `${locales.length === 1 ? 'no_' : ''}prefix`,
    ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
  });

  addPlugin(resolver.resolve('./plugin.js'), { append: true });
};
