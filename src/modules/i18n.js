import glob from 'glob-promise'
import getPackageName from 'get-package-name'
import P from 'path'
import { map } from '@dword-design/functions'

export default async function () {
  const localeFiles = await glob('*.json', {
    cwd: P.join(this.options.srcDir, 'i18n'),
  })
  if (localeFiles.length > 0) {
    this.addModule([
      getPackageName(require.resolve('nuxt-i18n')),
      {
        locales:
          localeFiles
          |> map(filename => {
            const code = P.basename(filename, '.json')
            return { code, iso: code, file: filename }
          }),
        lazy: true,
        langDir: 'i18n/',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: false,
          fallbackLocale: 'en',
        },
        seo: true,
        vueI18n: {
          fallbackLocale: 'en',
        },
      },
    ])
  }
}
