import { installModule } from '@nuxt/kit'
import packageName from 'depcheck-package-name'
import { globby } from 'globby'
import P from 'path'

const defaultLocale = 'en'

export default async (options, nuxt) => {
  const localeFiles = await globby('*.json', {
    cwd: P.join(nuxt.options.srcDir, 'i18n'),
  })
  if (localeFiles.length > 0) {
    await installModule(packageName`@nuxtjs/i18n`, {
      defaultLocale,
      detectBrowserLanguage:
        localeFiles.length === 1
          ? false
          : {
              fallbackLocale: defaultLocale,
              redirectOn: 'no prefix',
              useCookie: false,
            },
      langDir: 'i18n',
      lazy: true,
      locales: localeFiles.map(filename => {
        const code = P.basename(filename, '.json')

        return { code, file: filename, iso: code }
      }),
      strategy: localeFiles.length === 1 ? 'no_prefix' : 'prefix',
      ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    })
  }
}
